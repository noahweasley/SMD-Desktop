require("dotenv").config();
const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { app } = require("electron");
const path = require("path");
const { open, readdir } = require("fs/promises");
const { pipeline } = require("stream/promises");
const { getDownloadsDirectory } = require("../util");
const { createWriteStream } = require("fs");
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
  async function getYtdlpBinaryFilepath() {
    const binaryFileDirectory = getYtdlpBinaryFileDirectory();
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
  async function downloadMatchingTrack(request) {
    const ytdlpBinaryFileLocation = await getYtdlpBinaryFilepath();
    const dirname = path.dirname(ytdlpBinaryFileLocation);
    const fileName = process.platform == "win32" ? path.join(dirname, "yt-dlp.exe") : path.join(dirname, "yt-dlp");

    let ytdlpWrapper = new ytdlp(fileName);
    // 140 here means that the audio would be extracted
    let downloadStream = ytdlpWrapper.execStream([request.videoUrl, "-f", "140"]);

    try {
      downloadStream.emit("binaries-downloading");
      let isBinaryDownloaded = await downloadYTDLPBinaries();

      if (isBinaryDownloaded) {
        downloadStream.emit("binaries-downloaded");
        downloadStream.on("progress", (progress) => {
          console.log(progress.percent);
        });
        // pipe results to file
        const requestVideoTitle = request.videoTitle.replace(/\s+/g, "_"); // replace whitespace with underscore
        let pathToStoreFile = path.join(getDownloadsDirectory(), `${requestVideoTitle}.m4a`);
        await pipeline(downloadStream, createWriteStream(pathToStoreFile));
      } else {
        downloadStream.emit("error", "Download Failed");
      }
    } catch (err) {
      downloadStream.emit("error", err.message);
    } finally {
      downloadStream.destroy();
    }

    return downloadStream;
  }

  /**
   * Download YTDLP binaries
   *
   * @returns  a promise that would be fulfilled when the binaries are downloaded
   */
  async function downloadYTDLPBinaries() {
    let fileHandle;
    const binaryFileDirectory = getYtdlpBinaryFileDirectory();

    try {
      fileHandle = await open(binaryFileDirectory, "r+");
      return true;
    } catch (err) {
      return downloadFromGithubAndHandleErrors();
    } finally {
      fileHandle?.close();
    }

    async function downloadFromGithubAndHandleErrors() {
      try {
        await ytdlp.downloadFromGithub(binaryFileDirectory);
        return true;
      } catch (err) {
        return false;
      }
    }
  }

  return {
    downloadMatchingTrack,
    downloadYTDLPBinaries,
    searchMatchingTracks,
    getYtdlpBinaryFileDirectory,
    getYtdlpBinaryFilepath
  };
}

module.exports = __exports();
