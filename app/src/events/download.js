"use-strict";

const { ipcMain, dialog } = require("electron");
const ytdl = require("../main/server/youtube-dl");
const spotifyDl = require("../main/server/spotify-dl");
const downloader = require("../main/downloads/downloader");
const { Type, States } = require("../main/database/constants");

module.exports = function (settings, browsers, database) {
  const { downloadWindow, searchWindow, mainWindow } = browsers;
  let { getSpotifyLinkData } = spotifyDl(settings);

  let downloadQuery;
  const DEFAULT_CONCURRENCY = 2;
  const WHITE_SPACE = " ";
  let downloadTasks = [];

  // TODO: change settings.getStateSync to use promises
  const fileDownloader = downloader({
    targetWindow: mainWindow,
    maxParallelDownloads: settings.getStateSync("max-parallel-download", DEFAULT_CONCURRENCY)
  });

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
  ipcMain.handle("search-tracks", async () => {
    const error_message = "Uh-oh!! We couldn't find any tracks";

    if (downloadQuery.type == "search") {
      let searchResults;
      try {
        // Wrap the search results in an array, because the list requires an array as result
        searchResults = await ytdl.searchMatchingTracks(downloadQuery.value);
        return searchResults ? Array.of(searchResults) : error_message;
      } catch (err) {
        console.error(err);
        return "An Unknown Error Occurred";
      }
    } else if (downloadQuery.type == "track") {
      try {
        const spotifyLinkData = await getSpotifyLinkData();
        // description: { songTitle, artistNames: [] }
        let trackDescription = spotifyLinkData.description;
        let searchQuery = `${trackDescription.songTitle} ${trackDescription.artistNames.join(WHITE_SPACE)}`;
        let searchResults = await ytdl.searchMatchingTracks(searchQuery);
        return searchResults ? Array.of(searchResults) : error_message;
      } catch (err) {
        console.error(err);
        return "An Unknown Error Occurred";
      }
    } else {
      let tracks = downloadQuery.description.trackCollection;
      // map track object to reasonable search query ([Song title] [Artist name])
      const getSearchQuery = () => tracks.map((track) => `${track.songTitle} ${track.artistNames.join(WHITE_SPACE)}`);
      // transform search queries to search promise
      let queryPromises = getSearchQuery().map((searchQuery) => ytdl.searchMatchingTracks(searchQuery));
      // resolve and return search queries
      try {
        return await Promise.all(queryPromises);
      } catch (err) {
        console.error(err);
        return "An Unknown Error Occurred";
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
      // map the data from search results into required database format

      const downloadData = searchQueryResults
        .map((searchQueryResult) => ({
          Track_Playlist_Title: "-",
          Track_Artists: "-",
          Error_Occurred: false,
          Download_State: States.ACTIVE,
          Download_Progress: 0,
          Track_Title: searchQueryResult.videoTitle,
          Track_Url: searchQueryResult.videoUrl,
          Downloaded_Size: "Unknown",
          Track_Download_Size: "Unknown",
          Message: "Download in progress..." /* A default message to init downloads */
        }))
        .flat();

      // then add the search results the pending downloads database

      try {
        const insertedDataColumnIds = await database.addDownloadData({
          type: Type.DOWNLOADING,
          data: downloadData
        });

        if (insertedDataColumnIds) {
          // update download list UI, with current pending download data]
          mainWindow.getWindow()?.send("download-list-update", [downloadData, insertedDataColumnIds]);
        } else {
          // probably some write error to the database
          dialog.showErrorBox(
            "Unknown Error Occurred",
            "Check if there is enough space on disk, which is required to save data"
          );
        }
      } catch (err) {
        // ? i also don't understand this error too. What were you expecting ?
        dialog.showErrorBox("Unknown Error Occurred", "That's all we know for now");
      }
    }
  });

  ipcMain.on("initiate-downloads", async () => {
    let downloadStream = fileDownloader.initiateQueuedDownloads();
    setupTaskQueueMessaging();

    function setupTaskQueueMessaging() {
      // eslint-disable-next-line no-unused-vars
      downloadStream.forEach((_progressEmitter) => {
        // set up messenger
      });
      // clear task queue, downloads are now active
      fileDownloader.clearTaskQueue();
    }
  });

  // eslint-disable-next-line no-unused-vars
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
