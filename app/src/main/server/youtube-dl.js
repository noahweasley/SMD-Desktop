const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { app } = require("electron");
const path = require("path");
const { fs } = require("fs");
const isDev = require("../test/is-debug");

const BINARY_LOCATION = path.join("/Users/Noah/Desktop", "ytdlp");

/**
 * Searches YouTube for a list of matching videos specified by `query`
 *
 * @param {*} query the search query
 */
module.exports.searchMatchingTracks = async function (query) {
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
};

/**
 * Downloads track specified by `options`
 *
 * @param {*} options an object describing the video. {videoLink : ... , videoId : ...}
 * @returns a YTDLP event emitter instance
 */
module.exports.downloadMatchingTrack = async function (options) {
  let isDownloaded = await this.downloadYTDLPBinaries();

  if (isDownloaded) {
    let ytdlpWrapper = new ytdlp(Setup.binaryLocation);
    ytdlpWrapper
      .execStream([options.videoLink, "-f", "140"]) /** 140 here means that the audio would be extracted */
      .on("progress", (progress) => {
        console.log(progress.percent);
      })
      .pipe(fs.createWriteStream(`${options.videoTitle}.m4a`));

    return ytdlpWrapper;
  } else {
    return null;
  }
};

/**
 * Download YTDLP binaries
 *
 * @returns a promise that would be fulfilled when the binaries are downloaded
 */
module.exports.downloadYTDLPBinaries = async function () {
  return new Promise((resolve, reject) => {
    fs.open(Setup.binaryLocation, "r+", async (err, _fd) => {
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
