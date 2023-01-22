"use-strict";

const { getSpotifyURLType } = require("../main/util/sp-util");
const auth = require("../main/server/authorize");
const spotifyDl = require("../main/server/spotify-dl");
const { app, shell, ipcMain, clipboard, dialog, BrowserWindow } = require("electron");
const { join } = require("path");
const dummy = require("../main/util/dummy");
const { Type } = require("../main/database/constants");

module.exports = function (settings, browsers, database) {
  const { mainWindow, downloadWindow, aboutWindow } = browsers;
  const { authorizeApp } = auth(settings);
  const { getSpotifyLinkData } = spotifyDl(settings);

  // dummy data query for testing
  ipcMain.handle("get-dummy-list-data", () => [dummy.getDummyTrack(10), dummy.getDummyTrack(2)]);

  // get app info
  ipcMain.handle("app-details", () => [app.getName(), app.getVersion()]);

  // play music
  ipcMain.on("play-music", (_event, arg) => shell.openPath(join(`file://${app.getPath("music")}`, app.getName(), arg)));

  // delete file in database
  ipcMain.handle("delete-file", async (_event, arg) => await database.deleteDownloadData(arg, arg.mode));

  // after pasting url and download window is about to display it's content
  ipcMain.handle("download-data", () => getSpotifyLinkData());

  // show about window
  ipcMain.on("show-app-info", () => aboutWindow.init());

  // show download details window
  ipcMain.on("show-download-window", () => downloadWindow.init());

  // request to reload current focused window
  ipcMain.on("reload-current-window", () => BrowserWindow.getFocusedWindow()?.reload());

  // application authorization
  ipcMain.handle("authorize-app", async (_event, args) => {
    if (args[1] == "auth-youtube") {
      let states = await settings.setStates({
        "yt-api-key-received": true,
        "yt-api-key": args[0]
      });

      return states.length === 2;
    } else {
      return authorizeApp(args, () => mainWindow.getWindow()?.reload());
    }
  });

  // clipboard content request
  ipcMain.handle("clipboard-request", () => {
    try {
      return getSpotifyURLType(clipboard.readText());
    } catch (err) {
      // display modal dialog with details of error
      // Todo remove or fix this dialog code. Code is never executed, therefore, this dialog is never shown
      dialog.showErrorBox(
        "Clipboard content not a Spotify link",
        "Go to Spotify and copy playlist or song link, then click 'Paste URL'"
      );

      return err.message;
    }
  });

  ipcMain.on("show-error-unknown-dialog", () => {
    // display modal dialog with details of error
    dialog.showErrorBox(
      "Uh ohh !! That was a malformed Spotify URL",
      "Re-copy playlist or song link, then click 'Paste URL' again"
    );
  });

  // link navigate
  ipcMain.on("navigate-link", (_event, arg) => {
    let linkByType;
    switch (arg) {
      case "#music":
        linkByType = join(`file://${app.getPath("music")}`, app.getName(), "download");
        break;
      case "#video":
        linkByType = join(`file://${app.getPath("video")}`, app.getName(), "download");
        break;
      default:
        linkByType = arg;
    }

    // then open link in default app
    shell.openExternal(linkByType);
  });

  // Todo fix getDownloadData() retrieving strange data
  // request to fetch and display list data
  ipcMain.handle("get-list-data", async () => {
    try {
      let d1 = await database.getDownloadData({ type: Type.DOWNLOADED });
      let d2 = await database.getDownloadData({ type: Type.DOWNLOADING });
      return [d1, d2];
    } catch (error) {
      return console.error("Error occurred while fetching list data: ", error.message);
    }
  });
};
