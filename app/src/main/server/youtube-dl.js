const { pipeline } = require("stream/promises");
const { createWriteStream } = require("fs");
const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const path = require("path");
const { M4A } = require("../util/file-extensions");

const {
  watchFileForChanges,
  getBinaryFilepath,
  getDownloadsDir,
  checkIfFileExists,
  getOrCreateBinaryFileDirectory,
  isBinaryDownloadLocked,
  clearDownloadLockFile,
  createDownloadLockFile
} = require("../util/files");
const { IllegalStateError } = require("../util/error");

function __exports() {
  /**
   * Binary download signal
   */
  const Signal = Object.freeze({
    EXISTS_NOT_DOWNLOADED: "SIG_EXISTS_NOT_DOWNLOADED",
    NOT_EXISTS_DOWNLOADED: "SIG_NOT_EXISTS_DOWNLOADED",
    NOT_EXISTS_NOT_DOWNLOADED: "SIG_NOT_EXISTS_NOT_DOWNLOADED"
  });

  /**
   * Download YTDLP binaries
   *
   * @returns {Promise<string>} promise that would be fulfilled when the binaries are downloaded
   */
  async function downloadBinaries() {
    const binaryFileExists = await checkIfFileExists(getBinaryFilepath());

    if (binaryFileExists) {
      return Signal.EXISTS_NOT_DOWNLOADED;
    } else {
      const parentDirectory = await getOrCreateBinaryFileDirectory();
      const ytdlpBinaryFilepath = getBinaryFilepath(parentDirectory);
      try {
        await createDownloadLockFile(); // hold the lock
        await ytdlp.downloadFromGithub(ytdlpBinaryFilepath);
        // wait for binary download to properly finish
        if (process.platform === "win32") await watchFileForChanges(getBinaryFilepath());
        return Signal.NOT_EXISTS_DOWNLOADED;
      } catch (error) {
        return Signal.NOT_EXISTS_NOT_DOWNLOADED;
      } finally {
        await clearDownloadLockFile(); // release the lock
      }
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
      const queryKeywords = query.split(" ");
      // filters some useless results
      searchResults = searchResults.filter((searchResult) =>
        queryKeywords.some((queryKeyword) => searchResult.title.toLowerCase().includes(queryKeyword.toLowerCase()))
      );

      const queryResultsMap = searchResults.map((vob) => ({
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
   * @param {JSON} options an object describing the video. `{ task, request, targetWindow }`
   * @returns an object with the download stream and the the download pipe promise that would be fulfilled when the files
   *          have been written to disk
   */
  async function downloadMatchingTrack(options) {
    let downloadStream, downloadPipePromise;
    const taskId = options.task.id;
    const request = options.request;
    const target = options.targetWindow.getWindow();
    let binaryFileExists;

    try {
      binaryFileExists = await checkIfFileExists(getBinaryFilepath());
      while (await isBinaryDownloadLocked());

      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", true);
      const downloadSignal = await downloadBinaries();
      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", false);

      if (downloadSignal === Signal.NOT_EXISTS_DOWNLOADED || downloadSignal === Signal.EXISTS_NOT_DOWNLOADED) {
        const ytdlpWrapper = new ytdlp(getBinaryFilepath());
        downloadStream = ytdlpWrapper.execStream(["-f", "140", request.videoUrl]);

        const fileToStoreData = path.join(getDownloadsDir(), request.videoTitle.concat(M4A));

        _registerDownloadEvents({ downloadStream, fileToStoreData, taskId, target, request });
        downloadPipePromise = pipeline(downloadStream, createWriteStream(fileToStoreData));
      } else {
        throw new IllegalStateError("Fatal error occurred, cannot download");
      }
    } finally {
      // make sure that progress dialog is closed no matter what happens
      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", false);
    }

    return { downloadStream, downloadPipePromise };
  }

  function _registerDownloadEvents(args) {
    const { downloadStream, fileToStoreData, taskId, target, request } = args;

    downloadStream.on("progress", (progress) => {
      target.webContents.send("download-progress-update", {
        id: taskId,
        filename: fileToStoreData,
        title: request.videoTitle,
        progress: progress.percent,
        event: "download"
      });
    });

    downloadStream.on("end", () => {
      target.webContents.send("download-progress-update", {
        id: taskId,
        filename: fileToStoreData,
        title: request.videoTitle,
        progress: 101,
        event: "end"
      });
    });

    downloadStream.on("ytDlpEvent", (event) => {
      if (event === "info" || event === "youtube") {
        target.webContents.send("download-progress-update", {
          id: taskId,
          filename: fileToStoreData,
          title: request.videoTitle,
          progress: -1,
          event: "info"
        });
      }
    });

    downloadStream.on("error", () => {
      target.webContents.send("download-progress-update", {
        id: taskId,
        event: "error"
      });
    });
  }

  return {
    Signal,
    downloadMatchingTrack,
    downloadBinaries,
    searchMatchingTracks
  };
}

module.exports = __exports();
