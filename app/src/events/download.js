"use-strict";

const { ipcMain } = require("electron");
const ytdl = require("../main/server/youtube-dl")

module.exports = function (settings, browsers, database, queryDownloadData) {
  // request to search for tracks to download
  ipcMain.handle("search-tracks", async (_event) => {
    let tracks = queryDownloadData.description.trackCollection;
    // map track object to reasonable search query ([Song title] [Artist name])
    const getSearchQuery = () => tracks.map((track) => `${track.songTitle} ${track.artistNames.join(" ")}`);
    // transform search queries to search promise
    let queryPromises = getSearchQuery().map((searchQuery) => ytdl.searchMatchingTracks(searchQuery));
    // resolve and return search queries
    return await Promise.all(queryPromises);
  });
};
