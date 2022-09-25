const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { app } = require("electron");
const path = require("path");
const { open } = require("fs/promises");
const { pipeline } = require("stream/promises");

/**
 * Searches YouTube for a list of matching videos specified by `query`
 *
 * @param {*} query the search query
 */
module.exports.searchMatchingTracks = async function (query) {
  try {
    let sarr = await ytSearch.search(query);

    let m_sarr = sarr.map((video) => {
      let videoOb = {
        videoId: video.id.videoId,
        videoUrl: video.url,
        videoTitle: video.title
      };

      return videoOb;
    });

    return {
      searchQuery: query,
      searchQueryList: m_sarr
    };
  } catch (err) {
    return Promise.reject(new Error("Network error occurred"));
  }
};

/**
 * Downloads track specified by `options`
 *
 * @param {*} options an object describing the video. `{videoLink : ... , videoId : ...}`
 * @returns a YTDLP event emitter instance
 */
module.exports.downloadMatchingTrack = async function (options) {
  const BINARY_LOCATION = path.join(true ? "/Users/Noah/Desktop" : app.getPath("appData"), "ytdlp");

  let ytdlpWrapper = new ytdlp(BINARY_LOCATION);
  // 140 here means that the audio would be extracted
  let downloadStream = ytdlpWrapper.execStream([options.videoLink, "-f", "140"]);

  try {
    downloadStream.emit("binaries-downloading");
    let isDownloaded = await this.downloadYTDLPBinaries();

    if (isDownloaded) {
      downloadStream.emit("binaries-downloaded");
      downloadStream.on("progress", (progress) => {
        console.log(progress.percent);
      });
      // pipe results to file
      pipeline(downloadStream, fs.createWriteStream(`${options.videoTitle}.m4a`));
    } else {
      downloadStream.emit("error", "Download Failed");
    }
  } catch (err) {
    downloadStream.emit("error", err.message);
  } finally {
    downloadStream.destroy();
  }

  return downloadStream;
};

/**
 * Download YTDLP binaries
 *
 * @returns a promise that would be fulfilled when the binaries are downloaded
 */
module.exports.downloadYTDLPBinaries = async function () {
  return new Promise((resolve, reject) => {
    open(BINARY_LOCATION, "r+", async (err, _fd) => {
      if (err && err.code == "ENOENT") {
        try {
          await ytdlp.downloadFromGithub(BINARY_LOCATION);
          resolve(true);
        } catch (err) {
          reject(false);
        }
      } else {
        resolve(true);
      }
    });
  });
};
