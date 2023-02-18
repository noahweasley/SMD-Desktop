require("dotenv").config();
const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { app } = require("electron");
const path = require("path");
const { open, readdir, access, mkdir } = require("fs/promises");
const { pipeline } = require("stream/promises");
const { getDownloadsDirectory, watchFileForChanges } = require("../util");
const { createWriteStream } = require("fs");
const { EventEmitter } = require("events");

function __exports() {
  function _getYtdlpBinaryFilepath(parentDirectory) {
    return process.platform == "win32" ? path.join(parentDirectory, "yt-dlp.exe") : path.join(parentDirectory, "yt-dlp");
  }

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
    const ytdlpBinaryFileDirectory = parentDirectory || getYtdlpBinaryFileDirectory();
    return _getYtdlpBinaryFilepath(ytdlpBinaryFileDirectory);
  }

  /**
   * Checks if the binary file directory has been created, if not, it creates it and returns the directory path
   *
   * @returns a Promise that resolves to the directory where the the ytdlp binary file was downloaded
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
   * Checks if the binary file has been downloaded and/or exists then return the file path, if not, it throws an error
   *
   * @returns the full file path to the ytdlp binary file
   */
  async function getYtdlpBinaryFilepathThrowingErrorIfNotExist() {
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
      let searchResults = await ytSearch.search(query);

      let m_searchResults = searchResults.map((vob) => ({
        videoId: vob.id.videoId,
        videoUrl: vob.url,
        videoTitle: vob.title
      }));

      return {
        searchQuery: query,
        searchQueryList: m_searchResults
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
    let progressEmitter = new EventEmitter();
    let _downloadStream;
    const request = options.request;
    const target = options.targetWindow.getWindow();

    try {
      target.webContents.send("show-binary-download-dialog", true);
      let isBinaryDownloaded = await downloadYtdlpBinaries();
      target.webContents.send("show-binary-download-dialog", false);

      if (isBinaryDownloaded) {
        const ytdlpBinaryFilepath = getYtdlpBinaryFilepath();
        const dirname = path.dirname(ytdlpBinaryFilepath);
        const filename = _getYtdlpBinaryFilepath(dirname);

        let ytdlpWrapper = new ytdlp(filename);
        // 140 here means that the audio would be extracted
        _downloadStream = ytdlpWrapper.execStream([request.videoUrl, "-f", "140"]);

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
        console.log("Could not download binary");
        progressEmitter?.emit("err", new Error(`Fatal error occurred, cannot download binaries`));
      }
    } catch (err) {
      progressEmitter?.emit("error", err);
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
      return await downloadFromGithubAndHandleErrors();
    } finally {
      fileHandle?.close();
    }

    async function downloadFromGithubAndHandleErrors() {
      const parentDirectory = await getYtdlpBinaryFileDirectoryOrCreateIfNotExist();
      const ytdlpBinaryFilepath = getYtdlpBinaryFilepath(parentDirectory);
      try {
        await Promise.all([
          watchFileForChanges(ytdlpBinaryFilepath) /* await file creation */,
          ytdlp.downloadFromGithub(ytdlpBinaryFilepath)
        ]);
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
    getYtdlpBinaryFilepathThrowingErrorIfNotExist
  };
}

module.exports = __exports();
