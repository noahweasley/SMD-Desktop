"use-strict";

const spotifyDownloader = require("./server/spotify-dl");
const Settings = require("./settings/settings");
const { refreshSpoifyAccessToken, authorizeApp } = require("./server/authorize");
const ytDl = require("./server/youtube-dl");
const { SpotifyURLType, getSpotifyURLType } = require("./util");
const database = require("./database/database");
const menu = require("./menu");
const dummy = require("./dummy");

const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, ipcMain, shell, clipboard, dialog, Menu } = require("electron");

// ---------------------------------------------------------------------------------

var WINDOW_STATE;
let queryDownloadData, querySeletedIndices;
var smd_window, search_window, download_window, about_window;

const State = Object.freeze({
  BLURRED: "window-blurred",
  FOCUSED: "window-focused",
  MAXIMIZED: "window-maximized",
  MINIMIZED: "window-minimized",
  DEFAULT: "window-default"
});

app.whenReady().then(async () => {
  createAppFiles();
  let windowState = await Settings.getState("window-state");
  createApplicationWindow(windowState);
  // ==================================
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createApplicationWindow();
  });
});

app.on("window-all-closed", () => {
  smd_window = null;
  if (process.platform !== "darwin") app.quit();
});

// ... window acton click
ipcMain.on("action-click-event", (_event, id) => {
  if (id === "window-action-close") {
    smd_window.close();
  } else if (id === "window-action-minimize") {
    smd_window.minimize();
  } else {
    if (!!!WINDOW_STATE || WINDOW_STATE === State.DEFAULT) {
      smd_window.maximize();
      WINDOW_STATE = State.MAXIMIZED;
    } else {
      smd_window.restore();
      WINDOW_STATE = State.DEFAULT;
    }
  }
});

// ... link navigate
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

ipcMain.handle("get-dummy-list-data", () => {
  return [dummy.getDummyTrack(10), dummy.getDummyTrack(2)];
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

// ... show about window
ipcMain.on("show-app-info", () => createAboutWindow());

// ... get app info
ipcMain.handle("app-details", () => {
  return [app.getName(), app.getVersion()];
});

// ... settings requests
ipcMain.handle("get-states", async (_event, args) => {
  return await Settings.getState(args[0], args[1]);
});

ipcMain.handle("get-multiple-states", async (_event, args) => {
  return await Settings.getStates(args);
});

// simple debug; sending renderer process log messsages to the main process; [0] = tag, [1] = message
ipcMain.on("debug", (_event, args) => {
  console.log(`${args[0]}: ${args[1]}\n\n`);
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

// ... settings requests
ipcMain.handle("set-states", (_event, args) => {
  return Settings.setStateSync(args[0], args[1]);
});

// ... application authorization
ipcMain.handle("authorize-app", async (_event, args) => {
  if (args[1] == "auth-youtube") {
    let [res1, res2] = await Promise.all([
      Settings.setState("yt-api-key-received", true),
      Settings.setState("yt-api-key", args[0])
    ]);

    return res1 && res2;
  } else {
    authorizeApp(args);
  }
});

// ...
ipcMain.handle("download-data", () => {
  return getSongData();
});

// ... search download details window
ipcMain.on("show-search-download-window", (_event) => {
  createSearchWindow();
});

// ... show download details window
ipcMain.on("show-download-window", (_event) => {
  createDownloadWindow();
});

// ... request to start downloading
ipcMain.on("begin-download", (_event, args) => beginDownloads(args));

// .. request to reload current focused window
ipcMain.on("reload-current-window", () => {
  BrowserWindow.getFocusedWindow().reload();
});

// ... download acton click
ipcMain.on("search-click-event", (_event, args) => {
  queryDownloadData = args[1];
  querySeletedIndices = args[2];

  download_window.close();
  if (args[0] === "proceed-download") {
    createSearchWindow();
  }
});

// ... clipboard content request
ipcMain.handle("clipboard-request", () => {
  let urlType, errMsg;
  try {
    urlType = getSpotifyURLType(clipboard.readText());
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

// ... request to search for tracks to download
ipcMain.handle("search-tracks", async (_event) => {
  return await soundcloud.searchTracks({ data: queryDownloadData, indices: querySeletedIndices });
});

/**
 * @returns an object with the requested Spotify data
 */
function getSongData() {
  let data, spotifyURLType;
  let clipboardContent = clipboard.readText();

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

  spotifyApi.setClientId(Settings.getStateSync("spotify-user-client-id"));
  spotifyApi.setClientSecret(Settings.getStateSync("spotify-user-client-secret"));
  spotifyApi.setAccessToken(Settings.getStateSync("spotify-access-token"));
  spotifyApi.setRefreshToken(Settings.getStateSync("spotify-refresh-token"));

  const spotifyLinkRegex = new RegExp("https://open.spotify.com");
  try {
    if (spotifyLinkRegex.test(clipboardContent)) {
      // then ...
      switch (spotifyURLType) {
        case SpotifyURLType.TRACK:
          data = spotifyDownloader.performTrackDownloadAction(clipboardContent);
          break;
        case SpotifyURLType.ALBUM:
          data = spotifyDownloader.performAlbumDownloadAction(clipboardContent);
          break;
        case SpotifyURLType.ARTIST:
          data = spotifyDownloader.performArtistDownloadAction(clipboardContent);
          break;
        case SpotifyURLType.PLAYLIST:
          data = spotifyDownloader.performPlaylistDownloadAction(clipboardContent);
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

/**
 * Creates a download window with the data speified
 */
function createSearchWindow() {
  if (search_window) return;

  search_window = new BrowserWindow({
    title: "Choose tracks to download",
    parent: smd_window,
    show: false,
    modal: true,
    width: 700,
    height: 500,
    resizable: false,
    backgroundColor: "#0c0b0b",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "../preload.js")
    }
  });

  search_window.setMenu(null);
  search_window.loadFile(path.join("app", "pages", "search.html"));
  search_window.once("ready-to-show", search_window.show);
  // listening for close event on download window helped to solve quick window flash issue.
  // Adding hide() on window was the key to solve this issue, but I don't have an idea why
  // the quick flash issue occurrs.
  search_window.on("close", (event) => {
    event.preventDefault();
    search_window.hide();
    querySeletedIndices = null;
    queryDownloadData = null;
    search_window.destroy();
    search_window = null;
  });
}

/**
 * Spawns up a new SMD window with a limitations of 1 winodws
 */
async function createApplicationWindow() {
  // only 1 window is allowed to be spawned
  if (smd_window) return;

  let winState = await Settings.getState("window-state", {});
  try {
    winState = JSON.parse(winState);
  } catch (error) {
    winState = {};
  }

  smd_window = new BrowserWindow({
    x: winState.x,
    y: winState.y,
    show: false,
    backgroundColor: "#0c0b0b",
    frame: false,
    minWidth: 900,
    minHeight: 400,
    width: winState.width ? winState.width : 1000,
    height: winState.height ? winState.height : 620,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "../preload.js")
    }
  });

  Menu.setApplicationMenu(menu);

  smd_window.loadFile(path.join("app", "pages", "index.html"));

  // smd_window.webContents.openDevTools()
  smd_window.once("ready-to-show", () => {
    smd_window.show();
    // to prevent glith on window maximize, after displaying the window, then maximize it
    if (winState.isMaximized) {
      WINDOW_STATE = State.MAXIMIZED;
      smd_window.maximize();
    }
  });

  smd_window.on("close", async (event) => {
    event.preventDefault();
    let [x, y] = smd_window.getPosition();
    let [width, height] = smd_window.getSize();
    let isCompleted = await Settings.setState(
      "window-state",
      JSON.stringify({ x: x, y: y, width: width, height: height, isMaximized: smd_window.isMaximized() })
    );
    if (isCompleted) smd_window.destroy();
  });
}

function createDownloadWindow() {
  if (download_window) return;

  download_window = new BrowserWindow({
    title: "Condownload_windowfirm the list",
    parent: smd_window,
    show: false,
    modal: true,
    width: 700,
    height: 500,
    resizable: false,
    backgroundColor: "#0c0b0b",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "../preload.js")
    }
  });

  download_window.setMenu(null);
  download_window.loadFile(path.join("app", "pages", "downloads.html"));
  download_window.once("ready-to-show", download_window.show);
  // listening for close event on download window helped to solve quick window flash issue.
  // Adding hide() on window was the key to solve this issue, but I don't have an idea why
  // the quick flash issue occurrs.
  download_window.on("close", (event) => {
    event.preventDefault();
    download_window.hide();
    download_window.destroy();
    download_window = null;
  });
}

function createAboutWindow() {
  // only 1 window is allowed to be spawned
  if (about_window) {
    about_window.focus();
    return;
  }

  about_window = new BrowserWindow({
    title: `About ${app.getName()}`,
    show: false,
    width: 700,
    height: 500,
    resizable: false,
    backgroundColor: "#0c0b0b",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "../preload.js")
    }
  });

  Menu.setApplicationMenu(null);
  about_window.loadFile(path.join("app", "pages", "about.html"));
  about_window.once("ready-to-show", about_window.show);
  about_window.on("closed", () => (about_window = null));
}

/**
 * create the download directory
 */
function createAppFiles() {
  const downloadDir = path.join(app.getPath("music"), app.getName(), "Download");
  const thumbnailDir = path.join(downloadDir, ".thumb");
  const tempThumbDir = path.join(downloadDir, ".temp", ".thumb");

  fs.open(downloadDir, "r+", (err, _fd) => {
    if (err) {
      if (err.code === "EEXIST") return;
      else if (err.code === "ENOENT") {
        fs.mkdir(thumbnailDir, { recursive: true }, (_err) => {});
        fs.mkdir(tempThumbDir, { recursive: true }, (_err) => {});
      } else console.log(err.code);
    }
  });
}
