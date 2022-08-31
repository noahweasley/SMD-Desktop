"use-strict";

const { ipcMain } = require("electron");
const ytdl = require("../main/server/youtube-dl");
const spotifyDl = require("../main/server/spotify-dl");
const isDebug = require("../main/test/is-debug");
const dummy = require("../main/util/dummy");
const fdownloader = require("../main/downloads/downloader");

const fileDownloader = fdownloader({
  maxParallelDownloads: 2
});

module.exports = function (settings, browsers, _database) {
  let downloadQuery;
  const { downloadWindow, searchWindow, mainWindow } = browsers;
  let { getSpotifyLinkData } = spotifyDl(settings);
  let downloadTasks = [];

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
    const emp_error_message = "Uh-oh!! We couldn't find any tracks";
    let dummyTrackCollection = dummy.getDummyPlayList().description.trackCollection;

    if (downloadQuery.type == "search") {
      let searchResults;
      try {
        // Wrap the search results in an array, because the list requires an array as result
        searchResults = await ytdl.searchMatchingTracks(downloadQuery.value);
        return searchResults ? Array.of(searchResults) : emp_error_message;
      } catch (err) {
        return err.message;
      }
    } else if (downloadQuery.type == "track") {
      const spotifyLinkData = await getSpotifyLinkData();
      // description: { songTitle, artistNames: [] }
      let trackDescription = spotifyLinkData.description;
      let searchQuery = `${trackDescription.songTitle} ${trackDescription.artistNames.join(" ")}`;
      // Wrap the search results in an array, because the list requires an array as result
      let searchResults;
      try {
        searchResults = await ytdl.searchMatchingTracks(searchQuery);
        return searchResults ? Array.of(searchResults) : emp_error_message;
      } catch (err) {
        return err.message;
      }
    } else {
      let tracks = isDebug ? dummyTrackCollection : downloadQuery.description.trackCollection;
      // map track object to reasonable search query ([Song title] [Artist name])
      const getSearchQuery = () => tracks.map((track) => `${track.songTitle} ${track.artistNames.join(" ")}`);
      // transform search queries to search promise
      let queryPromises = getSearchQuery().map((searchQuery) => ytdl.searchMatchingTracks(searchQuery));
      // resolve and return search queries
      try {
        return await Promise.all(queryPromises);
      } catch (err) {
        return err.message;
      }
    }
  });

  // download click events
  ipcMain.on("download-click-event", async (_event, args) => {
    downloadQuery = args[1];

    searchWindow.getWindow()?.close();
    if (args[0] === "proceed-download") {
      // get an handler to be used later on file downloads
      downloadTasks = await fileDownloader.enqueueTasks(args[1]);
      mainWindow.getWindow()?.send("show-download-tasks", downloadTasks);
    }
  });
  
  ipcMain.on("initiate-downloads", fileDownloader.initiateDownloads)

  ipcMain.handle("pause", async (_event, _args) => {
    //
  });

  
  ipcMain.handle("pause-all", async (_event, _args) => {
    downloadTasks.forEach(task => task.pause())
  });

  ipcMain.handle("resume", async (_event, _args) => {
    //
  });

  ipcMain.handle("resume-all", async (_event, _args) => {
    downloadTasks.forEach(task => task.resume())
  });

  ipcMain.handle("cancel", async (_event, _args) => {
    //
  });

  ipcMain.handle("cancel-all", async (_event, _args) => {
    downloadTasks.forEach(task => task.cancel())
  });
};
