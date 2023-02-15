require("dotenv").config();
const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { app } = require("electron");
const path = require("path");
const { open } = require("fs/promises");
const { pipeline } = require("stream/promises");
const { getDownloadsDirectory } = require("../util");

const BINARY_LOCATION = !app.isPackaged ? process.env.BINARY_LOCATION : path.join(app.getPath("appData"), "ytdlp");

function __exports() {
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
    let ytdlpWrapper = new ytdlp(BINARY_LOCATION);
    // 140 here means that the audio would be extracted
    let downloadStream = ytdlpWrapper.execStream([request.link, "-f", "140"]);

    try {
      downloadStream.emit("binaries-downloading");
      let isDownloaded = await downloadYTDLPBinaries();

      if (isDownloaded) {
        downloadStream.emit("binaries-downloaded");
        downloadStream.on("progress", (progress) => {
          console.log(progress.percent);
        });
        // pipe results to file
        let pathToStoreFile = path.join(getDownloadsDirectory(), `${request.title}.m4a`);
        pipeline(downloadStream, fs.createWriteStream(pathToStoreFile));
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
    try {
      fileHandle = await open(BINARY_LOCATION, "r+");
    } catch (err) {
      await ytdlp.downloadFromGithub(BINARY_LOCATION);
    } finally {
      fileHandle?.close();
    }
  }

  return { downloadMatchingTrack, downloadYTDLPBinaries, searchMatchingTracks };
}

module.exports = __exports();
