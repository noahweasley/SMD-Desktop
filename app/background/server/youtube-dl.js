const ytdlp = require("yt-dlp-wrap").default;
const ytSearch = require("youtube-search-without-api-key");
const { app } = require("electron");
const path = require("path");
const { fs } = require("fs");

const BINARY_LOCATION = path.join(app.getPath("exe"), "ytdlp");

/**
 * Searches YouTube for a list of matching videos specified by `query`
 *
 * @param {*} query the video title to be used in search
 */
module.exports.searchMatchingTracks = (query) => {
  let sarr = await ytSearch.search(query);
  return sarr.map((video) => {
    let videoOb = {
      videoId: video.id.videoId,
      videoUrl: video.url,
      videoTitle: video.title
    };

    return videoOb;
  });
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
      .execStream([options.videoLink, "-f", "140"])
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
    fs.open(Setup.binaryLocation, "r+", (err, _fd) => {
      if (err && err.code == "ENOENT") {
        try {
          await ytdlp.downloadFromGithub(Setup.binaryLocation, Setup.binaryVersion);
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
