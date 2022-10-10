"use-strict";

const { ipcMain, dialog } = require("electron");
const ytdl = require("../main/server/youtube-dl");
const spotifyDl = require("../main/server/spotify-dl");
const fdownloader = require("../main/downloads/downloader");
const database = require("../main/database");
const { Type, States } = require("../main/database/constants");

module.exports = function (settings, browsers, _database) {
  let downloadQuery;
  const CONCURRENCY = 2;
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

    downloadWindow.getWindow()?.close();
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
      const searchQueryResults = args[1];
      downloadTasks = fileDownloader.enqueueTasks(searchQueryResults);
      addDownloadCallbacks(downloadTasks);

      // map the data from search results into required database format

      const downloadData = searchQueryResults
        .map((searchQueryResult) => searchQueryResult.searchQueryList)
        .map((searchQueryListItems) => {
          return searchQueryListItems.map((item) => ({
            Error_Occured: false,
            Download_State: States.ACTIVE,
            Track_Playlist_Title: "-",
            Track_Title: item.videoTitle,
            Track_Url: item.videoUrl,
            Track_Artists: "-",
            Downloaded_Size: "Unknown",
            Download_Progress: 0,
            Track_Download_Size: 0
          }));
        });

      // ... then add the search results the pending downloads database
      
      const isAdded = await database.addDownloadData({
        type: Type.DOWNLOADING,
        data: downloadData
      });

      if (isAdded) {
        // start file download process
        await fileDownloader.initiateDownloads();
        // update download list UI, with current pending download data]
        mainWindow.getWindow()?.send("download-list-update", searchQueryResults);
      } else {
        // probably some write error to the database
        dialog.showErrorBox(
          "Unknown Error Occurred",
          "Check if there is enough space on disk, which is required to save data"
        );
      }
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
