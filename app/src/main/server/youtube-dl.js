const { pipeline } = require("stream/promises");
const { createWriteStream } = require("fs");
const lockfile = require("proper-lockfile");
const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { setTimeout } = require("timers/promises");
const path = require("path");
const { M4A } = require("../util/file-extensions");
const { IllegalStateError } = require("../util/error");

const {
  watchFileForChangeEvent,
  getBinaryFilepath,
  getDownloadsDir,
  checkIfFileExists,
  getOrCreateBinaryFileDirectory
} = require("../util/files");

function __exports() {
  const lockOptions = { realpath: false };

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
      try {
        await lockfile.lock(getBinaryFilepath(), lockOptions);
        const parentDirectory = await getOrCreateBinaryFileDirectory();
        const ytdlpBinaryFilepath = getBinaryFilepath(parentDirectory);
        await ytdlp.downloadFromGithub(ytdlpBinaryFilepath);
        // wait for binary download to properly finish
        if (process.platform === "win32") await watchFileForChangeEvent(getBinaryFilepath());
        return Signal.NOT_EXISTS_DOWNLOADED;
      } catch (error) {
        return Signal.NOT_EXISTS_NOT_DOWNLOADED;
      } finally {
        await lockfile.unlock(getBinaryFilepath(), lockOptions);
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

      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", true);
      // if (await lockfile.check(getBinaryFilepath(), lockOptions)) {
      //   await setTimeout(2000);
      //   downloadMatchingTrack(options);
      // }
      const downloadSignal = await downloadBinaries();
      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", false);

      if (downloadSignal === Signal.NOT_EXISTS_DOWNLOADED || downloadSignal === Signal.EXISTS_NOT_DOWNLOADED) {
        const downloadStream = await tryDownload(request);
        const fileToStoreData = path.join(getDownloadsDir(), request.videoTitle.concat(M4A));

        registerDownloadEvents({ downloadStream, fileToStoreData, taskId, target, request });
        downloadPipePromise = pipeline(downloadStream, createWriteStream(fileToStoreData));
      } else {
        throw new IllegalStateError("Fatal error occurred, cannot download");
      }
    } finally {
      // make sure that progress dialog is closed no matter what happens
      target.webContents.send("show-binary-download-dialog", false);
    }

    return { downloadStream, downloadPipePromise };
  }

  async function tryDownload(request, retries = 20) {
    if (retries > 0) {
      try {
        const ytdlpWrapper = new ytdlp(getBinaryFilepath());
        return ytdlpWrapper.execStream(["-f", "140", request.videoUrl]);
      } catch (err) {
        if (process.platform === "win32") await watchFileForChangeEvent(getBinaryFilepath());
        return tryDownload(request, retries - 1);
      }
    } else {
      throw Error("Download Retry Timeout");
    }
  }

  function registerDownloadEvents(args) {
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
        progress: 0,
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
