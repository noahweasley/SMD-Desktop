require("dotenv").config();
const { app } = require("electron");
const { open, readdir, mkdir } = require("fs/promises");
const { pipeline } = require("stream/promises");
const { createWriteStream } = require("fs");
const { getDownloadsDirectory, watchFileForChanges } = require("../util/files");
const FILE_EXTENSIONS = require("./file-extensions");
const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const path = require("path");

function __exports() {
  const binaryFilename = "yt-dlp";

  const Signal = Object.freeze({
    EXISTS_NOT_DOWNLOADED: "SIG_EXISTS_NOT_DOWNLOADED",
    NOT_EXISTS_DOWNLOADED: "SIG_NOT_EXISTS_DOWNLOADED",
    NOT_EXISTS_NOT_DOWNLOADED: "SIG_NOT_EXISTS_NOT_DOWNLOADED"
  });

  function _getBinaryFilepath(parentDirectory) {
    const filePath = path.join(parentDirectory, binaryFilename);
    return process.platform == "win32" ? filePath.concat(FILE_EXTENSIONS.EXE) : filePath;
  }

  /**
   * @returns the directory where the the ytdlp binary file was downloaded
   */
  function getBinaryFileDirectory() {
    return process.env.BINARY_LOCATION || path.join(app.getPath("appData"), binaryFilename);
  }

  /**
   * Retrieves the binary file path, if `parentDirectory` is undefined,  it finds the binary file directory
   *
   * @param {string} parentDirectory the directory in which to append to the binary file path
   * @returns the full file path to the ytdlp binary file
   */
  function getBinaryFilepath(parentDirectory) {
    const binaryFileDirectory = parentDirectory || getBinaryFileDirectory();
    return _getBinaryFilepath(binaryFileDirectory);
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

    return true;
  }

  /**
   * Checks if the binary file has been downloaded and/or exists then return the file path, if not, it throws an error
   *
   * @returns the full file path to the ytdlp binary file
   */
  async function getBinaryFilepathOrThrowError() {
    const binaryFileDirectory = await getOrCreateBinaryFileDirectory();

    try {
      const files = await readdir(binaryFileDirectory);

      const filePath = files.find(
        (file) => path.basename(file, path.extname(file)).toLowerCase() === binaryFilename.toLowerCase()
      );

      if (filePath) {
        const fullBinaryFilepath = path.join(binaryFileDirectory, filePath);
        return fullBinaryFilepath;
      } else {
        throw new Error(`File '${binaryFilename}' not found in directory '${binaryFileDirectory}'`);
      }
    } catch (err) {
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
      let queryResults = await ytSearch.search(query);
      const queryKeywords = query.split(" ");
      
      // filters some useless results
      queryResults = queryResults.filter((queryResult) =>
        queryKeywords.some((queryKeyword) => queryResult.title.toLowerCase().includes(queryKeyword.toLowerCase()))
      );

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
   * @param {JSON} options an object describing the video. `{ task, request, targetWindow }`
   * @returns an object with the download stream and the the download pipe promise that would be fulfilled when the files have been written to disk
   */
  async function downloadMatchingTrack(options) {
    let downloadStream, downloadPipePromise;
    const taskId = options.task.id;
    const request = options.request;
    const target = options.targetWindow.getWindow();
    // eslint-disable-next-line no-unused-vars
    const isDownloadPaused = options.paused;
    let binaryFileExists;

    try {
      binaryFileExists = await checkIfBinaryExists();

      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", true);
      const downloadSignal = await downloadBinaries();
      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", false);
      // wait for binary to finish downloading
      if (downloadSignal == Signal.NOT_EXISTS_DOWNLOADED) await watchFileForChanges(getBinaryFilepath());

      if (downloadSignal == Signal.NOT_EXISTS_DOWNLOADED || downloadSignal == Signal.EXISTS_NOT_DOWNLOADED) {
        const ytdlpBinaryFilepath = getBinaryFilepath();
        const dirname = path.dirname(ytdlpBinaryFilepath);
        const filename = getBinaryFilepath(dirname);

        const ytdlpWrapper = new ytdlp(filename);
        downloadStream = ytdlpWrapper.execStream(["-f", "140", request.videoUrl]);

        const fileToStoreData = path.join(getDownloadsDirectory(), request.videoTitle.concat(FILE_EXTENSIONS.M4A));

        _registerDownloadEvents({ downloadStream, fileToStoreData, taskId, target, request });
        downloadPipePromise = pipeline(downloadStream, createWriteStream(fileToStoreData));
      } else {
        console.log("Fatal error occurred, cannot download");
      }
    } catch (err) {
      // make sure that progress dialog is closed no matter
      if (!binaryFileExists) target.webContents.send("show-binary-download-dialog", false);
      downloadStream?.emit("error", err);
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
      if (event === "info" || event == "youtube") {
        target.webContents.send("download-progress-update", {
          id: taskId,
          filename: fileToStoreData,
          title: request.videoTitle,
          progress: 102,
          event: "info"
        });
      }
    });
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
