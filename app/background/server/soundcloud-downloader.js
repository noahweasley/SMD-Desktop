"use-trict";

const soundcloudApi = require("soundcloud-v2-api");
const scdl = require("soundcloud-downloader").default;
const Settings = require("../settings/settings");
const fs = require("fs");
const stream = require("stream");
const { SpotifyURLType } = require("../util");

module.exports.searchTracks = async function (arg) {
  let querySeletedIndices = arg.indices;
  let queryDownloadData = arg.data;
  let queryType = queryDownloadData.type;
  let dataDescription = queryDownloadData.description;
  let albumTracks = dataDescription.albumTracks;
  let playlistTracks = dataDescription.trackCollection;

  let queries = [];
  let searchResults = [];

  let soundcloudClientId = await Settings.getState("soundcloud-user-client-id");
  if (!soundcloudClientId) return;

  soundcloudApi.init({
    clientId: soundcloudClientId
  });

  let listLength = albumTracks ? albumTracks.length : playlistTracks.length;

  for (let x = 0; x < listLength; x++) {
    switch (queryType) {
      case SpotifyURLType.ALBUM:
        let ssArtistNames = "";
        let track = albumTracks[x];
        let artistNames = track.artistNames;
        let songTitle = track.songTitle;

        artistNames.forEach((entry) => (ssArtistNames = ssArtistNames.concat(entry).concat(" ")));

        queries.push(songTitle + " - " + ssArtistNames);
        break;
      case SpotifyURLType.PLAYLIST:
        let sArtistNames = "";
        let track1 = playlistTracks[x];
        let artistNames1 = track1.artistNames;
        let songTitle1 = track1.songTitle;

        artistNames1.forEach((entry) => (sArtistNames = sArtistNames.concat(entry).concat(" ")));

        queries.push(songTitle1 + " - " + sArtistNames);
        break;
      case SpotifyURLType.TRACK:
        break;
      case SpotifyURLType.ARTIST:
      case SpotifyURLType.UNKNOWN:
        return;
    }
  }

  ///////////////////////////////////////////

  for (let x = 0; x < listLength; x++) {
    // now loop through all the search queries generated
    let keywords = queries[x].split(" ");

    try {
      let result = await soundcloudApi.get("/search/tracks", {
        q: queries[x],
        limit: 20
      });

      let collection = result["collection"];

      let $collection = collection.filter((track) => {
        let matches = true;
        for (let keyword of keywords) {
          matches &= queries[x].toUpperCase().includes(keyword.toUpperCase());
        }

        return track.downloadable == true && matches;
      });

      searchResults.push({ query: queries[x], result: $collection });
    } catch (error) {
      console.log(error.message);
      return error.message;
    }
  }

  console.log(searchResults);
};

module.exports.downloadTracks = async function (tracks = []) {
  let writer = fs.createWriteStream("");

  scdl.download("").then((downloadStream) => {
    downloadStream.on("readable", () => {});

    downloadStream.on("end", () => {
      console.log("Download ended");
    });
  });
};
