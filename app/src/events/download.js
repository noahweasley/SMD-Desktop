"use-strict";

const { ipcMain } = require("electron");
const ytdl = require("../main/server/youtube-dl");
const spotifyDl = require("../main/server/spotify-dl");
const isDebug = require("../main/test/is-debug");
const dummy = require("../main/util/dummy");

module.exports = function (settings, browsers, _database) {
  let downloadQuery;
  const { downloadWindow, searchWindow } = browsers;
  let { getSpotifyLinkData } = spotifyDl(settings);

  // search download details window
  ipcMain.on("show-search-download-window", (_event, searchQuery) => {
    if (searchQuery) downloadQuery = searchQuery;
    searchWindow.init();
  });

  // download acton click
  ipcMain.on("search-click-event", (_event, args) => {
    downloadQuery = args[1];

    downloadWindow.getWindow().close();
    if (args[0] === "proceed-download") {
      searchWindow.init();
    }
  });

  // request to search for tracks to download
  ipcMain.handle("search-tracks", async (_event) => {
    let dummyTrackCollection = dummy.getDummyPlayList().description.trackCollection;

    if (downloadQuery.type == "search") {
      let searchResults;
      try {
        // Wrap the search results in an array, because the list requires an array as result
        searchResults = await ytdl.searchMatchingTracks(downloadQuery.value);
        return searchResults ? Array.of(searchResults) : "Uh-oh!! We couldn't find any tracks";
      } catch (err) {
        return err.message;
      }
    } else if (downloadQuery.type == "track") {
      const spotifyLinkData = await getSpotifyLinkData();
      // description: { songTitle, artistNames: [] }
      let trackDescription = spotifyLinkData.description;
      let searchQuery = `${trackDescription.songTitle} ${trackDescription.artistNames.join(" ")}`;
      // Wrap the search results in an array, because the list requires an array as result
      return Array.of(await ytdl.searchMatchingTracks(searchQuery));
    } else {
      let tracks = isDebug ? dummyTrackCollection : downloadQuery.description.trackCollection;
      // map track object to reasonable search query ([Song title] [Artist name])
      const getSearchQuery = () => tracks.map((track) => `${track.songTitle} ${track.artistNames.join(" ")}`);
      // transform search queries to search promise
      let queryPromises = getSearchQuery().map((searchQuery) => ytdl.searchMatchingTracks(searchQuery));
      // resolve and return search queries
      return await Promise.all(queryPromises);
    }
  });

  // download click events
  ipcMain.on("download-click-event", async (_event, args) => {
    downloadQuery = args[1];

    searchWindow.getWindow().close();
    if (args[0] === "proceed-download") {
      console.log("Downloading tracks!!!!!");
    }
  });
};
