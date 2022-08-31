const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { app } = require("electron");
const path = require("path");
const fs = require("fs");
const isDebug = require("../test/is-debug");
const { EventEmitter } = require("events");

const BINARY_LOCATION = path.join(isDebug ? "/Users/Noah/Desktop" : app.getPath("appData"), "ytdlp");

/**
 * Searches YouTube for a list of matching videos specified by `query`
 *
 * @param {*} query the search query
 */
module.exports.searchMatchingTracks = async function (query) {
  if (isDebug) {
    // developement code
    let m_sarr1 = [
      {
        videoId: "video.id.videoId",
        videoUrl: "video.url",
        videoTitle: "Alan waker The official audio"
      }
    ];

    return Promise.resolve({
      searchQuery: query,
      searchQueryList: m_sarr1
    });
  } else {
    // production code
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
  }
};

/**
 * Downloads track specified by `options`
 *
 * @param {*} options an object describing the video. {videoLink : ... , videoId : ...}
 * @returns a YTDLP event emitter instance
 */
module.exports.downloadMatchingTrack = async function (options) {
  let downloadEmitter = new EventEmitter();
  let ytdlpWrapper = new ytdlp(BINARY_LOCATION);

  downloadEmitter.emit("download-binaries");
  try {
    let isDownloaded = await this.downloadYTDLPBinaries();

    if (isDownloaded) {
      downloadEmitter.emit("binaries-downloaded");

      ytdlpWrapper
        .execStream([options.videoLink, "-f", "140"]) /** 140 here means that the audio would be extracted */
        .on("progress", (progress) => {
          console.log(progress.percent);
        })
        .pipe(fs.createWriteStream(`${options.videoTitle}.m4a`));
        
    } else {
      downloadEmitter.emit("error", "Download Failed");
    }
  } catch (err) {
    downloadEmitter.emit("error", err.message);
  }

  return downloadEmitter;
};

/**
 * Download YTDLP binaries
 *
 * @returns a promise that would be fulfilled when the binaries are downloaded
 */
module.exports.downloadYTDLPBinaries = async function () {
  return new Promise((resolve, reject) => {
    fs.open(BINARY_LOCATION, "r+", async (err, _fd) => {
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
