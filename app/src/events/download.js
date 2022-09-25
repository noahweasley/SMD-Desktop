"use-strict";

const { ipcMain } = require("electron");
const ytdl = require("../main/server/youtube-dl");
const spotifyDl = require("../main/server/spotify-dl");
const fdownloader = require("../main/downloads/downloader");
const database = require("../main/database");
const { Mode, Type } = require("../main/database/constants");

module.exports = function (settings, browsers, _database) {
  let downloadQuery;
  let CONCURRENCY = 2;
  const { downloadWindow, searchWindow, mainWindow } = browsers;

  const fileDownloader = fdownloader({
    win: mainWindow,
    maxParallelDownloads: CONCURRENCY
  });

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
      let tracks = downloadQuery.description.trackCollection;
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
      const searchResults = args[1];
      downloadTasks = fileDownloader.enqueueTasks(searchResults);
      addDownloadCallbacks(downloadTasks);

      const downloadData = searchResults.map((searchResult) => {
        return {
          Error_Occured: false,
          Downloaded_Size: "Unknown",
          Track_Title: searchResult.videoTitle,
          Download_Progress: "0"
        };
      });

      const isAdded = await database.addDownloadData({ type: Type.DOWNLOADING, data: downloadData }, Mode.SINGLE);

      if (isAdded) mainWindow.getWindow()?.send("download-list-update", searchResults);
      else console.log("downloads was not added");
    }

    function addDownloadCallbacks(downloadTasks) {
      downloadTasks.forEach((downloadTask) => {
        downloadTask.addDownloadCallback((_err, _pos, _progress) => {
          // logic to send to renderer
        });
      });
    }
  });

  ipcMain.on("initiate-downloads", async () => await fileDownloader.initiateDownloads());

  ipcMain.handle("pause", async (_event, _args) => {});

  ipcMain.handle("pause-all", async () => {
    downloadTasks.forEach((task) => task.pause());
  });

  ipcMain.handle("resume", async (_event, args) => {
    let { listPos } = args;
    downloadTasks[listPos].resume();
  });

  ipcMain.handle("resume-all", async () => {
    downloadTasks.forEach((task) => task.resume());
  });

  ipcMain.handle("cancel", async (_event, args) => {
    let { listPos } = args;
    downloadTasks[listPos].cancel();
  });

  ipcMain.handle("cancel-all", async () => {
    downloadTasks.forEach((task) => task.cancel());
  });
};
