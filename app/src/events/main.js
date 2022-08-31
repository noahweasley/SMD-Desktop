"use-strict";

const { getSpotifyURLType } = require("../main/util/sp-util");
const auth = require("../main/server/authorize");
const spotifyDl = require("../main/server/spotify-dl");
const { app, shell, ipcMain, clipboard, dialog, BrowserWindow } = require("electron");
const path = require("path");
const isDebug = require("../main/test/is-debug");
const dummy = require("../main/util/dummy");

module.exports = function (settings, browsers, database) {

  const { mainWindow, downloadWindow, aboutWindow } = browsers;
  const { authorizeApp } = auth(settings);
  const { getSpotifyLinkData } = spotifyDl(settings);

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
        mainWindow.getWindow()?.reload();
      });
    }
  });

  // after pasting url and download window is about to display it's content
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

  // request to reload current focused window
  ipcMain.on("reload-current-window", () => {
    BrowserWindow.getFocusedWindow()?.reload();
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
};
