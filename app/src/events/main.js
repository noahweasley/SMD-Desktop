"use-strict";

const { getSpotifyURLType } = require("../main/util/sp-util");
const auth = require("../main/server/authorize");
const spotifyDl = require("../main/server/spotify-dl");
const { app, shell, ipcMain, clipboard, dialog, BrowserWindow } = require("electron");
const { join } = require("path");
const dummy = require("../main/util/dummy");
const { Type } = require("../main/database/constants");
const { stat } = require("fs/promises");
const { getReadableSize } = require("../main/util/math");

module.exports = function (settings, browsers, database) {
  const { mainWindow, downloadWindow, aboutWindow } = browsers;
  const { getSpotifyLinkData, spotifyApi } = spotifyDl(settings);
  const { authorizeApp } = auth(settings, spotifyApi);

  // dummy data query for testing
  ipcMain.handle("get-dummy-list-data", () => [dummy.getDummyTrack(10), dummy.getDummyTrack(2)]);
  // get app info
  ipcMain.handle("app-details", () => [app.getName(), app.getVersion()]);
  // play music
  ipcMain.on("play-music", (_event, arg) => shell.openPath(join(`file://${app.getPath("music")}`, app.getName(), arg)));
  // delete file in database
  ipcMain.handle("delete-file", async (_event, arg) => await database.deleteDownloadData(arg));

  // after pasting url and download window is about to display it's content
  ipcMain.handle("download-data", () => getSpotifyLinkData());

  // show about window
  ipcMain.on("show-app-info", () => aboutWindow.init());

  // show download details window
  ipcMain.on("show-download-window", () => downloadWindow.init());

  // request to reload current focused window
  ipcMain.on("reload-current-window", () => BrowserWindow.getFocusedWindow()?.reload());

  // file downloaded, delete downloading data and move to downloaded data
  ipcMain.handle("finish-downloading", async (_event, arg) => {
    const isEntryDeleted = await database.deleteDownloadData(arg);
    const filepath = arg.filename;
    const title = arg.title;

    if (isEntryDeleted) {
      const sizeInBytes = (await stat(filepath)).size;
      const fileSize = getReadableSize(sizeInBytes);

      const downloadedData = {
        TrackDownloadSize: fileSize,
        TrackPlaylistTitle: "-",
        TrackTitle: title,
        TrackArtists: "No Artists",
        TrackUri: filepath
      };

      const entryId = await database.addDownloadData(downloadedData);
      const isAdded = entryId != -1;
      return [isAdded, downloadedData];
    } else {
      return [false, undefined];
    }
  });

  // application authorization
  ipcMain.handle("authorize-app", async (_event, args) => {
    if (args[1] == "auth-youtube") {
      const states = await settings.setStates({
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
      dialog.showErrorBox(
        "Clipboard content not a Spotify link",
        "Go to Spotify and copy playlist or song link, then click 'Paste URL'"
      );

      return err.message;
    }
  });

  ipcMain.on("show-error-unknown-dialog", (_event, error) => {
    const defaultTitle = "Uh ohh !! That was a malformed Spotify URL";
    const defaultMessage = "Re-copy playlist or track url, then click 'Paste URL' again";
    dialog.showErrorBox(error.title || defaultTitle, error.message || defaultMessage);
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

  // TODO: fix getDownloadData() retrieving strange data
  // request to fetch and display list data
  ipcMain.handle("get-list-data", async (_event, returning) => {
    let d1, d2;

    try {
      if (returning == Type.DOWNLOADED) {
        d1 = await database.getDownloadData({ type: Type.DOWNLOADED });
      } else if (returning == Type.DOWNLOADING) {
        d2 = await database.getDownloadData({ type: Type.DOWNLOADING });
      } else {
        d1 = await database.getDownloadData({ type: Type.DOWNLOADED });
        d2 = await database.getDownloadData({ type: Type.DOWNLOADING });
      }
      return [d1, d2];
    } catch (error) {
      // TODO: add proper visual representation of this database data retrieval error
      return console.error("Error occurred while fetching list data: ", error.message);
    }
  });
};
