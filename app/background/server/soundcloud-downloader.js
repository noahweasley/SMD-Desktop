"use-trict";

const soundcloudApi = require("soundcloud-v2-api");
const scdl = require("soundcloud-downloader").default;
// const Settings = require("../settings/settings");
const fs = require("fs");

module.exports.searchTracks = async function (tracks = []) {
  // let soundcloudClientId = await Settings.getState("soundcloud-user-client-id");
  soundcloudApi.init({
    clientId: "bK81qkMgEcojRkJDQYlFJ8tMi3viZEVU",
  });

  let result = await soundcloudApi.get("/search/tracks", {
    q: "Olamide Science students",
    limit: 50,
  });

  let collection = result["collection"];
  collection = collection.filter(track => track.downloadable === true).map(track => track.uri);
  
  scdl.download(collection[1]).then(stream => {
      stream.pipe(fs.createWriteStream('Audio.mp3'));
  })
};

this.searchTracks()