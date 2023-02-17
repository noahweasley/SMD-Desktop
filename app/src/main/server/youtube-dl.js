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
  /**
   * @returns the directory where the the ytdlp binary file was downloaded
   */
  function getYtdlpBinaryFileDirectory() {
    return !app.isPackaged ? process.env.BINARY_LOCATION : path.join(app.getPath("appData"), "ytdlp");
  }

  /**
   * @returns the full file path to the ytdlp binary file
   */
  function getYtdlpBinaryFilepath(parentDirectory) {
    const dirname = parentDirectory || getYtdlpBinaryFileDirectory();
    const fullBinaryFilepath = process.platform == "win32" ? path.join(dirname, "yt-dlp.exe") : path.join(dirname, "yt-dlp");

    return fullBinaryFilepath;
  }

  /**
   * @returns the directory where the the ytdlp binary file was downloaded
   */
  async function getYtdlpBinaryFileDirectoryOrCreateIfNotExist() {
    const directoryPath = getYtdlpBinaryFileDirectory();

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
   * @returns the full file path to the ytdlp binary file
   */
  async function getYtdlpBinaryFilepathThrowingError() {
    const binaryFileDirectory = await getYtdlpBinaryFileDirectoryOrCreateIfNotExist();
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
   * @returns a YTDLP event emitter instance
   */
  async function downloadMatchingTrack(options) {
    let _downloadStream;
    const request = options.request;
    const target = options.targetWindow.getWindow();
    let remainingNumberOfRetriesTillEBUSY = 3;
    // Create a new event emitter to observe progress
    const progressEmitter = new EventEmitter();

    try {
      progressEmitter.emit("binaries-downloading");
      let isBinaryDownloaded = await downloadYtdlpBinaries();

      if (isBinaryDownloaded) {
        const ytdlpBinaryFilepath = getYtdlpBinaryFilepath();
        const dirname = path.dirname(ytdlpBinaryFilepath);
        const filename = process.platform == "win32" ? path.join(dirname, "yt-dlp.exe") : path.join(dirname, "yt-dlp");

        let ytdlpWrapper = new ytdlp(filename);
        // 140 here means that the audio would be extracted
        // EBUSY error, file might still be locked, wait for at most 3 seconds
        await (async function executeCommand() {
          try {
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

        progressEmitter.emit("binaries-downloaded");
        _downloadStream.on("progress", (progress) => {
          console.log(progress.percent);

          target.webContents.send("download-progress-update", {
            id: 0,
            progress: progress.percent,
            totalSize: progress.totalSize
          });
        });

        let fileToStoreData = path.join(getDownloadsDirectory(), `${request.videoTitle}.m4a`);
        await pipeline(_downloadStream, createWriteStream(fileToStoreData));
      } else {
        progressEmitter.emit("error", "Download Failed");
      }
    } catch (err) {
      progressEmitter.emit("error", err);
    } finally {
      _downloadStream?.destroy();
    }

    return progressEmitter;
  }

  /**
   * Download YTDLP binaries
   *
   * @returns  a promise that would be fulfilled when the binaries are downloaded
   */
  async function downloadYtdlpBinaries() {
    let fileHandle;
    let ytdlpBinaryFilepath;

    try {
      ytdlpBinaryFilepath = getYtdlpBinaryFilepath();
      fileHandle = await open(ytdlpBinaryFilepath, "r+");
      return true;
    } catch (err) {
      return downloadFromGithubAndHandleErrors();
    } finally {
      fileHandle?.close();
    }

    async function downloadFromGithubAndHandleErrors() {
      const parentDirectory = await getYtdlpBinaryFileDirectoryOrCreateIfNotExist();
      const ytdlpBinaryFilepath = getYtdlpBinaryFilepath(parentDirectory);
      try {
        await ytdlp.downloadFromGithub(ytdlpBinaryFilepath);
        return true;
      } catch (err) {
        return false;
      }
    }
  }

  return {
    downloadMatchingTrack,
    downloadYtdlpBinaries,
    searchMatchingTracks,
    getYtdlpBinaryFileDirectory,
    getYtdlpBinaryFileDirectoryOrCreateIfNotExist,
    getYtdlpBinaryFilepath,
    getYtdlpBinaryFilepathThrowingError
  };
}

module.exports = __exports();
