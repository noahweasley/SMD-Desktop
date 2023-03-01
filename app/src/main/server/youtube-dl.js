require("dotenv").config();
const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { app } = require("electron");
const path = require("path");
const { open, readdir, mkdir } = require("fs/promises");
const { pipeline } = require("stream/promises");
const { getDownloadsDirectory, delay } = require("../util");
const { createWriteStream } = require("fs");

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
    return process.env.BINARY_LOCATION || path.join(app.getPath("appData"), "ytdlp");
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
      await open(directoryPath, "r");
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
   * @returns {Promise<boolean>} a flag indicating if the binary file exists or not
   */
  async function checkIfBinaryExists() {
    const ytdlpBinaryFilepath = getBinaryFilepath();
    let fileHandle;

    try {
      fileHandle = await open(ytdlpBinaryFilepath, "r+");
    } catch (error) {
      return false;
    } finally {
      fileHandle?.close();
    }
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
      const files = await readdir(binaryFileDirectory);

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
      const queryResults = await ytSearch.search(query);

      const queryResultsMap = queryResults.map((vob) => ({
        videoId: vob.id.videoId,
        videoUrl: vob.url,
        videoTitle: vob.title
      }));

      return {
        searchQuery: query,
        searchQueryList: queryResultsMap
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
    let downloadStream;
    const taskId = options.taskId;
    const request = options.request;
    const target = options.targetWindow.getWindow();
    let numberOfRetriesTillEBUSY = 3;

    try {
      const binaryFileExists = await checkIfBinaryExists();

      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", true);

      const downloadSignal = await downloadBinaries();

      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", false);

      if (downloadSignal == Signal.NOT_EXISTS_DOWNLOADED || downloadSignal == Signal.EXISTS_NOT_DOWNLOADED) {
        const ytdlpBinaryFilepath = getBinaryFilepath();
        const dirname = path.dirname(ytdlpBinaryFilepath);
        const filename = _getBinaryFilepath(dirname);

        const ytdlpWrapper = new ytdlp(filename);
        // TODO: delay works on Windows, might not work on other Operating Systems. Use fs.watch instead
        // EBUSY error, file might still be locked, wait for at most 3 seconds
        await (async function executeCommand() {
          try {
            // 140 here means that the audio would be extracted
            downloadStream = ytdlpWrapper.execStream([request.videoUrl, "-f", "140"]);
          } catch (err) {
            if (err.code === "EBUSY") {
              if (numberOfRetriesTillEBUSY-- != 0) {
                await delay(1000);
                executeCommand();
              }
              downloadStream.emit("error", err);
            }
          }
        })();

        downloadStream.on("progress", (progress) => {
          target.webContents.send("download-progress-update", {
            id: taskId,
            progress: progress.percent
          });
        });

        const fileToStoreData = path.join(getDownloadsDirectory(), `${request.videoTitle}.m4a`);
        try {
          await pipeline(downloadStream, createWriteStream(fileToStoreData));
        } catch (ignored) {
          // ignored this error for now because the songs are downloaded but stream somehow contains data
        }
      } else {
        console.log("Fatal error occurred, cannot download, cause");
      }
    } catch (err) {
      downloadStream?.emit("error", err);
    } finally {
      downloadStream?.destroy();
    }

    return downloadStream;
  }

  /**
   * Download YTDLP binaries
   *
   * @returns {Promise<string>} promise that would be fulfilled when the binaries are downloaded
   */
  async function downloadBinaries() {
    const binaryFileExists = await checkIfBinaryExists();

    if (binaryFileExists) {
      return Signal.EXISTS_NOT_DOWNLOADED;
    } else {
      const parentDirectory = await getOrCreateBinaryFileDirectory();
      const ytdlpBinaryFilepath = getBinaryFilepath(parentDirectory);
      try {
        await ytdlp.downloadFromGithub(ytdlpBinaryFilepath);
        return Signal.NOT_EXISTS_DOWNLOADED;
      } catch (err) {
        return Signal.NOT_EXISTS_NOT_DOWNLOADED;
      }
    }
  }

  return {
    Signal,
    checkIfBinaryExists,
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
