require("dotenv").config();
const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { app } = require("electron");
const path = require("path");
const { open, readdir, access, mkdir } = require("fs/promises");
const { pipeline } = require("stream/promises");
const { getDownloadsDirectory, delay } = require("../util");
const { createWriteStream } = require("fs");
const { EventEmitter } = require("events");

function __exports() {
  const Signal = Object.freeze({
    EXISTS_NOT_DOWNLOADED: "SIG_EXISTS_NOT_DOWNLOADED",
    NOT_EXISTS_DOWNLOADED: "SIG_NOT_EXISTS_DOWNLOADED",
    NOT_EXISTS_NOT_DOWNLOADED: "SIG_NOT_EXISTS_NOT_DOWNLOADED"
  });

  function _getBinaryFilepath(parentDirectory) {
    return process.platform == "win32" ? path.join(parentDirectory, "yt-dlp.exe") : path.join(parentDirectory, "yt-dlp");
  }

  /**
   * @returns the directory where the the ytdlp binary file was downloaded
   */
  function getBinaryFileDirectory() {
    return !app.isPackaged ? process.env.BINARY_LOCATION : path.join(app.getPath("appData"), "ytdlp");
  }

  /**
   * @returns the full file path to the ytdlp binary file
   */
  function getBinaryFilepath(parentDirectory) {
    const ytdlpBinaryFileDirectory = parentDirectory || getBinaryFileDirectory();
    return _getBinaryFilepath(ytdlpBinaryFileDirectory);
  }

  /**
   * Checks if the binary file directory has been created, if not, it creates it and returns the directory path
   *
   * @returns a Promise that resolves to the directory where the the ytdlp binary file was downloaded
   */
  async function getOrCreateBinaryFileDirectory() {
    const directoryPath = getBinaryFileDirectory();

    try {
      await access(directoryPath);
    } catch (err) {
      if (err.code === "ENOENT") {
        await mkdir(directoryPath, { recursive: true });
      } else {
        throw err;
      }
    }

    return directoryPath;
  }

  /**
   * Checks if the binary file has been downloaded and/or exists then return the file path, if not, it throws an error
   *
   * @returns the full file path to the ytdlp binary file
   */
  async function getBinaryFilepathOrThrowError() {
    const binaryFileDirectory = await getOrCreateBinaryFileDirectory();
    const fileName = "yt-dlp";

    try {
      let files = await readdir(binaryFileDirectory);

      const filePath = files.find(
        (file) => path.basename(file, path.extname(file)).toLowerCase() === fileName.toLowerCase()
      );

      if (filePath) {
        const fullBinaryFilepath = path.join(binaryFileDirectory, filePath);
        return fullBinaryFilepath;
      } else {
        throw new Error(`File '${fileName}' not found in directory '${binaryFileDirectory}'`);
      }
    } catch (err) {
      console.error(err);
      return "";
    }
  }

  /**
   * Searches YouTube for a list of matching videos specified by `query`
   *
   * @param {string} query the search query
   */
  async function searchMatchingTracks(query) {
    try {
      let sarr = await ytSearch.search(query);

      let m_sarr = sarr.map((vob) => ({
        videoId: vob.id.videoId,
        videoUrl: vob.url,
        videoTitle: vob.title
      }));

      return {
        searchQuery: query,
        searchQueryList: m_sarr
      };
    } catch (err) {
      throw new Error("Network error occurred");
    }
  }

  /**
   * Downloads track specified by `options`
   *
   * @param {JSON} options an object describing the video. `{videoLink : ... , videoId : ...}`
   * @returns {YTDlpReadable} a YTDLP event emitter instance
   */
  async function downloadMatchingTrack(options) {
    let progressEmitter = new EventEmitter();
    let _downloadStream;
    const request = options.request;
    const target = options.targetWindow.getWindow();
    let remainingNumberOfRetriesTillEBUSY = 3;

    try {
      target.webContents.send("show-binary-download-dialog", true);
      let downloadSignal = await downloadBinaries();
      target.webContents.send("show-binary-download-dialog", false);

      if (downloadSignal == Signal.NOT_EXISTS_DOWNLOADED || downloadSignal == Signal.EXISTS_NOT_DOWNLOADED) {
        const ytdlpBinaryFilepath = getBinaryFilepath();
        const dirname = path.dirname(ytdlpBinaryFilepath);
        const filename = _getBinaryFilepath(dirname);

        let ytdlpWrapper = new ytdlp(filename);
        // TODO: delay works on Windows, might not work on other Operating Systems. Use fs.watch instead
        // EBUSY error, file might still be locked, wait for at most 3 seconds
        await (async function executeCommand() {
          try {
            // 140 here means that the audio would be extracted
            _downloadStream = ytdlpWrapper.execStream([request.videoUrl, "-f", "140"]);
          } catch (err) {
            if (err.code === "EBUSY") {
              if (remainingNumberOfRetriesTillEBUSY-- != 0) {
                await delay(1000);
                executeCommand();
              }
            }
          }
        })();

        _downloadStream.on("progress", (progress) => {
          target.webContents.send("download-progress-update", {
            id: 1,
            progress: progress.percent
          });
        });

        let fileToStoreData = path.join(getDownloadsDirectory(), `${request.videoTitle}.m4a`);
        try {
          await pipeline(_downloadStream, createWriteStream(fileToStoreData));
        } catch (ignored) {
          // ignored this error for now because the songs are downloaded but stream somehow contains data
        }
      } else {
        console.log("Fatal error occurred, cannot download, cause");
      }
    } catch (err) {
      progressEmitter?.emit("error", err);
    } finally {
      _downloadStream?.destroy();
    }

    return _downloadStream;
  }

  /**
   * Download YTDLP binaries
   *
   * @returns {Promise<string>} promise that would be fulfilled when the binaries are downloaded
   */
  async function downloadBinaries() {
    let fileHandle;
    let ytdlpBinaryFilepath;

    try {
      ytdlpBinaryFilepath = getBinaryFilepath();
      fileHandle = await open(ytdlpBinaryFilepath, "r+");
      return Signal.EXISTS_NOT_DOWNLOADED; // file exist
    } catch (err) {
      return downloadFromGithubAndHandleErrors();
    } finally {
      fileHandle?.close();
    }

    async function downloadFromGithubAndHandleErrors() {
      const parentDirectory = await getOrCreateBinaryFileDirectory();
      const ytdlpBinaryFilepath = getBinaryFilepath(parentDirectory);
      try {
        await ytdlp.downloadFromGithub(ytdlpBinaryFilepath);
        return Signal.NOT_EXISTS_DOWNLOADED; // File downloaded
      } catch (err) {
        return Signal.NOT_EXISTS_NOT_DOWNLOADED; // file does not exist and couldn't be downloaded
      }
    }
  }

  return {
    Signal,
    downloadMatchingTrack,
    downloadBinaries,
    searchMatchingTracks,
    getBinaryFileDirectory,
    getOrCreateBinaryFileDirectory,
    getBinaryFilepath,
    getBinaryFilepathOrThrowError
  };
}

module.exports = __exports();
