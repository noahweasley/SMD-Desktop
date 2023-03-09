"use-strict";

const { getSpotifyURLType } = require("../main/util/sp-util");
const auth = require("../main/server/authorize");
const spotifyDl = require("../main/server/spotify-dl");
const { deleteFilesInDirectory, getDownloadsDirectory, getReadableFileSize } = require("../main/util/files");
const { Type } = require("../main/database/constants");
const dummy = require("../main/util/dummy");
const { join } = require("path");
const { unlink } = require("fs/promises");
const { app, shell, ipcMain, clipboard, dialog, BrowserWindow } = require("electron");

module.exports = function (settings, browsers, database) {
  const { mainWindow, downloadWindow, aboutWindow } = browsers;
  const { getSpotifyLinkData, spotifyApi } = spotifyDl(settings);
  const { authorizeApp } = auth(settings, spotifyApi);

  ipcMain.handle("get-dummy-list-data", () => [dummy.getDummyTrack(10), dummy.getDummyTrack(2)]);

  ipcMain.handle("app-details", () => [app.getName(), app.getVersion()]);

  ipcMain.handle("download-data", () => getSpotifyLinkData());

  ipcMain.on("show-app-info", () => aboutWindow.init());

  ipcMain.on("show-download-window", () => downloadWindow.init());

  ipcMain.on("reload-current-window", () => BrowserWindow.getFocusedWindow()?.reload());

  ipcMain.on("play-music", (_event, fileUri) => shell.openPath(fileUri));

  ipcMain.handle("delete-file", async (_event, metadata) => {
    // return console.log(metadata);
    try {
      await unlink(metadata.data.trackUri);
      await database.deleteDownloadData(metadata);
      return true;
    } catch (error) {
      return false;
    }
  });

  ipcMain.handle("delete-all", async (_event, activeTab) => {
    const Response = Object.freeze({ PROCEED: 1, CANCEL: 0 });

    if (activeTab === ".tab-content__downloaded") {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      const returnedValue = await dialog.showMessageBox(focusedWindow, {
        noLink: true,
        checkboxChecked: false,
        defaultId: Response.CANCEL,
        type: "question",
        title: "Delete all",
        message: "Are you sure you want to delete all downloaded songs",
        checkboxLabel: "Delete corresponding file",
        buttons: ["Cancel", "Proceed"]
      });

      const response = returnedValue.response;
      const canDeleteFile = returnedValue.checkboxChecked;

      if (response == Response.PROCEED) {
        const isSuccessful = await database.deleteDownloadData({ type: Type.DOWNLOADED });
        if (isSuccessful && canDeleteFile) {
          return await deleteFilesInDirectory(getDownloadsDirectory());
        } else {
          return false;
        }
      } else {
        return false;
      }
    } else {
      // TODO: Cancel all download task
    }
  });

  ipcMain.handle("finish-downloading", async (_event, metadata) => {
    const isEntryDeleted = await database.deleteDownloadData(metadata);
    const filepath = metadata.data.filename;
    const title = metadata.data.title;

    if (isEntryDeleted) {
      const readableFileSize = getReadableFileSize(filepath);

      const downloadedData = {
        type: Type.DOWNLOADED,
        data: {
          TrackDownloadSize: readableFileSize,
          TrackPlaylistTitle: "-",
          TrackTitle: title,
          TrackArtists: "-",
          TrackUri: filepath
        }
      };

      const entryIds = await database.addDownloadData(downloadedData);
      const isAdded = entryIds.length > 0;
      return [isAdded, Array.of(downloadedData.data)];
    } else {
      return [false, undefined];
    }
  });

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

    if (arg == "#music") {
      linkByType = join(`file://${app.getPath("music")}`, app.getName(), "download");
    } else {
      linkByType = arg;
    }

    // then open link in default app
    shell.openExternal(linkByType);
  });

  ipcMain.handle("get-downloads-list-data", async (_event, returning) => {
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
