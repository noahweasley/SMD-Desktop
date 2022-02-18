"use-trict";

const soundcloudApi = require("soundcloud-v2-api");
const scdl = require("soundcloud-downloader").default;
const Settings = require("../settings/settings");
const fs = require("fs");
const stream = require("stream");
const { default: FORMATS } = require("soundcloud-downloader/src/formats");

module.exports.searchTracks = async function (tracks = []) {
  let searchResults = [];
  let soundcloudClientId = await Settings.getState("soundcloud-user-client-id");
  if (!soundcloudClientId) return;

  soundcloudApi.init({
    clientId: soundcloudClientId
  });

  for (let track of track) {
    let query = track.trackTitle;
    let keywords = query.split(" ");

    try {
      let result = await soundcloudApi.get("/search/tracks", {
        q: query,
        limit: 20
      });

      let collection = result["collection"];

      let $collection = collection.filter((track) => {
        let matches = true;
        for (let keyword of keywords) {
          matches &= track.title.toUpperCase().includes(keyword.toUpperCase());
        }

        return track.downloadable == true && matches;
      });
      // .map((track) => track.title);
      searchResults.push({ query, result: $collection });
    } catch (error) {
      console.log("An error occurred while establishing a secure connection");
    }
  }
};

module.exports.downloadTracks = async function (tracks = []) {
  let writer = fs.createWriteStream("");

  scdl.downloadFormat("", FORMATS.MP3).then((downloadStream) => {
    downloadStream.on("readable", () => {});

    downloadStream.on("end", () => {
      console.log("Download ended");
    });
  });
};
