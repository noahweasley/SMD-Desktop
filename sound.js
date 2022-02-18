"use-trict";

const Settings = require("../settings/settings");
const soundcloudApi = require("soundcloud-v2-api");
const scdl = require("soundcloud-downloader").default;
const fs = require("fs");

/**
 * Search for tracks with query parameters provided
 * 
 * @returns an aray of tracks found
 */
module.exports.searchTracks = async function (tracks) {
  soundcloudApi.init({
    clientId: await Settings.getState("soundcloud-user-client-id"),
  });

  let result = await soundcloudApi.get("/search/tracks", {
    q: "Olamide Science students",
    limit: 50,
  });

  return result["collection"];
};

/**
 * Downloads tracks, tracks having the same name as the track title
 * 
 * @param {*} trackCollection the list of tracks to be downloaded 
 */
module.exports.downloadTrackCollection = async function (trackCollection) {
  let collection = trackCollection.filter(track => track.downloadable === true).map(track => track.uri);
  
  scdl.download(collection[1]).then(stream => {
      stream.pipe(fs.createWriteStream('Audio.mp3'));
  })
}