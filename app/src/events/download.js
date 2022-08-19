"use-strict";

const { ipcMain } = require("electron");
const ytdl = require("../main/server/youtube-dl");
const isDebug = require("../main/test/is-debug");
const dummy = require("../main/util/dummy");

module.exports = function (_settings, browsers, _database) {
  let downloadQuery;
  const { downloadWindow, multiSearchWindow } = browsers;

  // download acton click
  ipcMain.on("search-click-event", (_event, args) => {
    downloadQuery = args[1];

    console.log(downloadQuery)
    downloadWindow.getWindow().close();
    if (args[0] === "proceed-download") {
      multiSearchWindow.init();
    }
  });

  // request to search for tracks to download
  ipcMain.handle("search-tracks", async (_event) => {
    let dummyTrackCollection = dummy.getDummyPlayList().description.trackCollection;
    let tracks = isDebug ? dummyTrackCollection : downloadQuery.description.trackCollection;
    // map track object to reasonable search query ([Song title] [Artist name])
    const getSearchQuery = () => tracks.map((track) => `${track.songTitle} ${track.artistNames.join(" ")}`);
    // transform search queries to search promise
    let queryPromises = getSearchQuery().map((searchQuery) => ytdl.searchMatchingTracks(searchQuery));
    // resolve and return search queries
    return await Promise.all(queryPromises);
  });

  // download click events
  ipcMain.on("download-click-event", async (_event, args) => {
    downloadQuery = args[1];

    multiSearchWindow.getWindow().close();
    if (args[0] === "proceed-download") {
      console.log("Downloading tracks!!!!!");
 
    }
  });
};
