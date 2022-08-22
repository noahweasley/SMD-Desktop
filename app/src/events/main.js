"use-strict";

const State = require("../browsers/state");
const { getSpotifyURLType } = require("../main/util/sp-util");
const { getSpotifyLinkData } = require("../main/server/spotify-dl");
const auth = require("../main/server/authorize");
const { app, shell, ipcMain, clipboard, dialog } = require("electron");
const path = require("path");
const isDebug = require("../main/test/is-debug");
const dummy = require("../main/util/dummy");

module.exports = function (settings, browsers, database) {
  let WINDOW_STATE = State.DEFAULT;

  const { mainWindow, downloadWindow, aboutWindow } = browsers;
  const { authorizeApp } = auth(settings);

  // window acton click
  ipcMain.on("action-click-event", (_event, id) => {
    if (id === "window-action-close") {
      mainWindow.getWindow().close();
    } else if (id === "window-action-minimize") {
      mainWindow.getWindow().minimize();
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

  // link navigate
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
    return getSpotifyLinkData();
  });

  // show about window
  ipcMain.on("show-app-info", () => {
    aboutWindow.init();
  });

  // show download details window
  ipcMain.on("show-download-window", () => {
    downloadWindow.init();
  });

  // request to start downloading
  ipcMain.on("begin-download", (_event, args) => beginDownloads(args));

  // request to reload current focused window
  ipcMain.on("reload-current-window", () => {
    if (BrowserWindow.getFocusedWindow() != null) BrowserWindow.getFocusedWindow().reload();
  });

  // clipboard content request
  ipcMain.handle("clipboard-request", () => {
    let urlType, errMsg;
    try {
      urlType = getSpotifyURLType(isDebug ? dummy.getRandomClipboardText() : clipboard.readText());
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
   * Starts donwloading tracks available at the the link url in the clipboard
   */
  async function beginDownloads(args) {
    let trackData;
    if (args) {
      trackData = args;
    } else {
      trackData = await getSpotifyLinkData();
    }
  }
};
