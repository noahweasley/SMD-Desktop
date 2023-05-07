const { getSpotifyURLType } = require("../util/sp-util");
const auth = require("../server/authorize");
const spotifyDl = require("../server/spotify-dl");
const { deleteFilesInDirectory, getDownloadsDirectory, getReadableFileSize } = require("../util/files");
const Type = require("../database/type");
const { v4: uuidv4 } = require("uuid");
const { join } = require("path");
const { unlink } = require("fs/promises");
const { app, shell, ipcMain, clipboard, dialog, BrowserWindow } = require("electron");

module.exports = function (settings, browsers, database) {
  const { mainWindow, downloadWindow, aboutWindow } = browsers;
  const { getSpotifyLinkData, spotifyApi } = spotifyDl(settings);
  const { authorizeApp } = auth(settings, spotifyApi);

  ipcMain.handle("app-details", () => [app.getName(), app.getVersion()]);

  ipcMain.handle("download-data", async () => {
    try {
      return await getSpotifyLinkData();
    } catch (error) {
      return error.message;
    }
  });

  ipcMain.on("show-app-info", () => aboutWindow.init());

  ipcMain.on("show-download-window", () => downloadWindow.init());

  ipcMain.on("reload-current-window", () => BrowserWindow.getFocusedWindow()?.reload());

  ipcMain.on("play-music", (_event, fileUri) => shell.openPath(fileUri));

  ipcMain.on("show-error-unknown-dialog", (_event, error) => {
    const defaultTitle = "An error occurred";
    const defaultMessage = "Please try again later";
    dialog.showErrorBox(error.title || defaultTitle, error.message || defaultMessage);
  });

  ipcMain.handle("delete-single", async (_event, metadata) => {
    const Response = Object.freeze({ PROCEED: 0, CANCEL: 1 });
    const track = metadata.data.TrackTitle;

    const focusedWindow = mainWindow.getWindow();
    const returnedValue = await dialog.showMessageBox(focusedWindow, {
      noLink: true,
      title: `Delete ${track}`,
      type: "question",
      message: `Are you sure you want to delete "${track}"`,
      checkboxChecked: false,
      checkboxLabel: "Delete corresponding file",
      defaultId: Response.CANCEL,
      buttons: ["Proceed", "Cancel"]
    });

    const response = returnedValue.response;
    const shouldDeleteFile = returnedValue.checkboxChecked;

    if (response === Response.PROCEED) {
      try {
        const isEntryDeleted = await database.deleteDownloadData(metadata);
        if (isEntryDeleted && shouldDeleteFile) {
          await unlink(metadata.data.TrackUri);
          return [false, true];
        } else {
          return [false, isEntryDeleted];
        }
      } catch (error) {
        return [true, false];
      }
    } else {
      return [false, false];
    }
  });

  ipcMain.handle("delete-all", async (_event, activeTab) => {
    const Response = Object.freeze({ PROCEED: 0, CANCEL: 1 });

    if (activeTab === ".tab-content__downloaded") {
      const focusedWindow = mainWindow.getWindow();
      const returnedValue = await dialog.showMessageBox(focusedWindow, {
        noLink: true,
        title: "Delete all",
        type: "question",
        message: "Are you sure you want to delete all downloaded songs",
        checkboxChecked: false,
        checkboxLabel: "Delete all corresponding files",
        defaultId: Response.CANCEL,
        buttons: ["Proceed", "Cancel"]
      });

      const response = returnedValue.response;
      const shouldDeleteFile = returnedValue.checkboxChecked;

      if (response === Response.PROCEED) {
        try {
          const isDBDeleteSuccessful = await database.deleteDownloadData({ type: Type.DOWNLOADED });
          if (isDBDeleteSuccessful && shouldDeleteFile) {
            return [false, await deleteFilesInDirectory(getDownloadsDirectory())];
          } else {
            return [false, isDBDeleteSuccessful];
          }
        } catch (error) {
          return [true, false];
        }
      } else {
        return [false, false];
      }
    } else {
      // TODO: Cancel all download task
      return [true, false];
    }
  });

  ipcMain.handle("finish-downloading", async (_event, metadata) => {
    const isEntryDeleted = await database.deleteDownloadData(metadata);
    const filepath = metadata.data.filename;
    const title = metadata.data.title;

    if (isEntryDeleted) {
      const readableFileSize = await getReadableFileSize(filepath);

      const downloadedData = {
        type: Type.DOWNLOADED,
        data: {
          id: uuidv4(),
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
    if (args[1] === "auth-youtube") {
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

  ipcMain.on("navigate-link", (_event, arg) => {
    let linkByType;

    if (arg === "#music") {
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
      if (returning === Type.DOWNLOADED) {
        d1 = await database.getDownloadData({ type: Type.DOWNLOADED });
      } else if (returning === Type.DOWNLOADING) {
        d2 = await database.getDownloadData({ type: Type.DOWNLOADING });
      } else {
        d1 = await database.getDownloadData({ type: Type.DOWNLOADED });
        d2 = await database.getDownloadData({ type: Type.DOWNLOADING });
      }

      return [d1, d2];
    } catch (error) {
      // TODO: add proper visual representation of this database data retrieval error
    }
  });
};
