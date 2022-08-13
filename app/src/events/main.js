"use-strict";

const State = require("../browsers/state");
const { SpotifyURLType, getSpotifyURLType } = require("../main/util/sp-util");
const spdl = require("../main/server/spotify-dl");
const { authorizeApp } = require("../main/server/authorize");
const { app, shell, ipcMain, clipboard, dialog } = require("electron");
const path = require("path");
const isDebugging = require("../main/test/is-debug");
const dummy = require("../main/util/dummy");
const spotifyApi = spdl.spotifyApi;

module.exports = function (settings, browsers, database, queryDownloadData) {
  let WINDOW_STATE = State.DEFAULT;
  const { mainWindow, downloadWindow, multiSearchWindow, singleSearchWindow, aboutWindow } = browsers;

  const smd_window = mainWindow.getWindow();

  // window acton click
  ipcMain.on("action-click-event", (_event, id) => {
    if (id === "window-action-close") {
      mainWindow.getWindow().close();
    } else if (id === "window-action-minimize") {
      smd_window.minimize();
    } else {
      if (!!!WINDOW_STATE || WINDOW_STATE === State.DEFAULT) {
        mainWindow.getWindow().maximize();
        WINDOW_STATE = State.MAXIMIZED;
      } else {
        mainWindow.getWindow().restore();
        WINDOW_STATE = State.DEFAULT;
      }
    }
  });

  //link navigate
  ipcMain.on("navigate-link", (_event, arg) => {
    let linkByType;
    switch (arg) {
      case "#music":
        linkByType = path.join(`file://${app.getPath("music")}`, app.getName(), "download");
        break;
      case "#video":
        linkByType = path.join(`file://${app.getPath("video")}`, app.getName(), "download");
        break;
      default:
        linkByType = arg;
    }

    // then open link in default app
    shell.openExternal(linkByType);
  });

  // request to fetch and display list data
  ipcMain.handle("get-list-data", async () => {
    try {
      let d1 = await database.getDownloadData({ type: database.Type.DOWNLOADED }, database.Mode.ALL);
      let d2 = await database.getDownloadData({ type: database.Type.DOWNLOADING }, database.Mode.ALL);
      return [d1, d2];
    } catch (error) {
      console.log("Error occurred while fetching data: ", error.message);
    }
  });

  // dummy data query for testing
  ipcMain.handle("get-dummy-list-data", () => {
    return [dummy.getDummyTrack(10), dummy.getDummyTrack(2)];
  });

  // get app info
  ipcMain.handle("app-details", () => {
    return [app.getName(), app.getVersion()];
  });

  // play music
  ipcMain.on("play-music", (_event, arg) => {
    shell.openPath(path.join(`file://${app.getPath("music")}`, app.getName(), arg));
  });

  // delete file in database
  ipcMain.handle("delete-file", async (_event, arg) => {
    let isDataDeleted = await database.deleteDownloadData(arg, arg.mode);
    return isDataDeleted;
  });

  // application authorization
  ipcMain.handle("authorize-app", async (_event, args) => {
    if (args[1] == "auth-youtube") {
      let states = await settings.setStates({
        "yt-api-key-received": true,
        "yt-api-key": args[0]
      });

      return states.length === 2;
    } else {
      return authorizeApp(args, function () {
        let mainWindow = mainWindow.getWindow();
        if (mainWindow) mainWindow.reload();
      });
    }
  });

  // ...
  ipcMain.handle("download-data", () => {
    return getSongData();
  });

  // show about window
  ipcMain.on("show-app-info", () => {
    aboutWindow.init();
  });

  // search download details window
  ipcMain.on("show-search-download-window", () => {
    multiSearchWindow.init();
  });

  // ... show single-track-search window
  ipcMain.on("show-single-search-window", () => {
    singleSearchWindow.init();
  });

  // ... show download details window
  ipcMain.on("show-download-window", () => {
    downloadWindow.init();
  });

  // ... request to start downloading
  ipcMain.on("begin-download", (_event, args) => beginDownloads(args));

  // .. request to reload current focused window
  ipcMain.on("reload-current-window", () => {
    if (BrowserWindow.getFocusedWindow() != null) BrowserWindow.getFocusedWindow().reload();
  });

  // download acton click
  ipcMain.on("search-click-event", (_event, args) => {
    queryDownloadData = args[1];

    downloadWindow.getWindow().close();
    if (args[0] === "proceed-download") {
      multiSearchWindow.init();
    }
  });

  // ... clipboard content request
  ipcMain.handle("clipboard-request", () => {
    let urlType, errMsg;
    try {
      urlType = getSpotifyURLType(isDebugging ? dummy.getRandomClipboardText() : clipboard.readText());
    } catch (err) {
      errMsg = err.message;
      // display modal dialog with details of error
      dialog.showErrorBox(
        "Clipboard content not a Spotify link",
        "Go to Spotify and copy playlist or song link, then click 'Paste URL'"
      );
    } finally {
      return urlType || errMsg;
    }
  });

  /**
   * @returns an object with the requested Spotify data
   */
  async function getSongData() {
    let data, spotifyURLType;
    let clipboardContent = isDebugging ? dummy.getRandomClipboardText() : clipboard.readText();

    try {
      spotifyURLType = getSpotifyURLType(clipboardContent);
    } catch (error) {
      // display modal dialog with details of error
      dialog.showErrorBox(
        "Clipboard content not a Spotify link",
        "Clipboard content has changed, go to Spotify and copy link again, then click 'Paste URL'"
      );

      return error.message;
    }

    let [spotifyUserClientId, spotifyClientSecret, spotifyAccessToken, spotifyRefreshToken] = await settings.getStates([
      "spotify-user-client-id",
      "spotify-user-client-secret",
      "spotify-access-token",
      "spotify-refresh-token"
    ]);

    spotifyApi.setClientId(spotifyUserClientId);
    spotifyApi.setClientSecret(spotifyClientSecret);
    spotifyApi.setAccessToken(spotifyAccessToken);
    spotifyApi.setRefreshToken(spotifyRefreshToken);

    const spotifyLinkRegex = new RegExp("https://open.spotify.com");
    try {
      if (spotifyLinkRegex.test(clipboardContent)) {
        // then ...
        switch (spotifyURLType) {
          case SpotifyURLType.TRACK:
            data = spdl.performTrackDownloadAction(clipboardContent);
            break;
          case SpotifyURLType.ALBUM:
            data = spdl.performAlbumDownloadAction(clipboardContent);
            break;
          case SpotifyURLType.ARTIST:
            data = spdl.performArtistDownloadAction(clipboardContent);
            break;
          case SpotifyURLType.PLAYLIST:
            data = spdl.performPlaylistDownloadAction(clipboardContent);
            break;
          default:
            throw new Error(`${spotifyURLType} link is either incomplete or is not supported yet`);
        }
      } else {
        // display modal dialog with details of error
        dialog.showErrorBox(
          "Clipboard content not a Spotify link",
          "Clipboard content has changed, go to Spotify and copy link, then click 'Paste URL'"
        );
      }
    } catch (err) {
      return err.message;
    }

    return data;
  }

  /**
   * Starts donwloading tracks available at the the link url in the clipboard
   */
  async function beginDownloads(args) {
    let trackData;
    if (args) {
      trackData = args;
    } else {
      trackData = await getSongData();
    }
  }
};
