"use-strict";

const Settings = require("../background/settings/settings");
const { refreshSpoifyAccessToken, authorizeApp } = require("../background/server/authorize");
const { SpotifyURLType, getSpotifyURLType } = require("../background/util");
const database = require("../background/database/database");
const menu = require("../background/menu");

const path = require("path");
const fs = require("fs");
const SpotifyWebApi = require("spotify-web-api-node");
const { app, BrowserWindow, ipcMain, shell, clipboard, dialog, Menu } = require("electron");

const spotifyApi = new SpotifyWebApi();

// ---------------------------------------------------------------------------------

var smd_window, download_window, about_window;
var WINDOW_STATE;

const State = Object.freeze({
  BLURRED: "window-blurred",
  FOCUSED: "window-focused",
  MAXIMIZED: "window-maximized",
  MINIMIZED: "window-minimized",
});

app.whenReady().then(() => {
  createAppFiles();
  let windowState = Settings.getState("window-state");
  createApplicationWindow(windowState);
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
    if (!!!WINDOW_STATE || WINDOW_STATE === State.MINIMIZED) {
      smd_window.maximize();
      WINDOW_STATE = State.MAXIMIZED;
    } else {
      smd_window.restore();
      WINDOW_STATE = State.MINIMIZED;
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
      linkByType = path.join(`file://${app.getPath("video")}`, app.getName());
      break;
    default:
      linkByType = arg;
  }

  // then open link in default app
  shell.openExternal(linkByType);
});

// request to fetch and display list data
ipcMain.handle("get-list-data", () => {
  // query list data from sqlite database
  return database.getDownloadData({}, database.Mode.ALL);
});

// ... show about window
ipcMain.on("show-app-info", () => createAboutWindow());

// ... get app info
ipcMain.handle("app-details", () => {
  return [app.getName(), app.getVersion()];
});

// ... settings requests
ipcMain.handle("get-states", (_event, args) => {
  return Settings.getState(args[0], args[1]);
});

// ... settings requests
ipcMain.handle("set-states", (_event, args) => {
  return Settings.setState(args[0], args[1]);
});

// ... application authorization
ipcMain.handle("authorize-app", (_event, args) => {
  authorizeApp(args);
});

// ...
ipcMain.handle("download-data", () => {
  return getSongData();
});

// ... show download details window
ipcMain.on("show-download-list", (_event) => {
  createDownloadWindow();
});

// ... request to start downloading
ipcMain.on("begin-download", (_event, args) => beginDownloads(args));

// ... download acton click
ipcMain.on("download-click-event", (_event, id) => {
  download_window.close();
  if (id === "proceed-download") beginDownloads();
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

  spotifyApi.setClientId(Settings.getState("spotify-user-client-id"));
  spotifyApi.setClientSecret(Settings.getState("spotify-user-client-secret"));
  spotifyApi.setAccessToken(Settings.getState("spotify-access-token"));
  spotifyApi.setRefreshToken(Settings.getState("spotify-refresh-token"));

  const spotifyLinkRegex = new RegExp("https://open.spotify.com");
  try {
    if (spotifyLinkRegex.test(clipboardContent)) {
      // then ...
      switch (spotifyURLType) {
        case SpotifyURLType.TRACK:
          data = performTrackDownloadAction(clipboardContent);
          break;
        case SpotifyURLType.ALBUM:
          data = performAlbumDownloadAction(clipboardContent);
          break;
        case SpotifyURLType.ARTIST:
          data = performArtistDownloadAction(clipboardContent);
          break;
        case SpotifyURLType.PLAYLIST:
          data = performPlaylistDownloadAction(clipboardContent);
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
 * starts album downlaod
 *
 * @param albumUrl the album identifier to be used in download
 * @throws error if error occurred while fetching data, this can be caused by network
 */
async function performAlbumDownloadAction(albumUrl, _limits) {
  let album = albumUrl.substring("https://open.spotify.com/album/".length, albumUrl.length);
  let data, dataReceived;

  for (let x = 0; x <= 3; x++) {
    try {
      data = await spotifyApi.getAlbum(album);
      dataReceived = true;
      break;
    } catch (err) {
      refreshSpoifyAccessToken();
    }
  }

  if (!dataReceived) return "An error occurred while retrieving album data";

  const body = data.body;
  const albumName = body["name"];

  return {
    type: SpotifyURLType.ALBUM,
    description: {},
  };
}

/**
 * starts artist download
 *
 * @param artistUrl the artist identifier to be used in download
 * @throws error if error occurred while fetching data, this can be caused by network
 */
async function performArtistDownloadAction(artistUrl, _limits) {
  let artist = artistUrl.substring("https://open.spotify.com/artist/".length, artistUrl.length);
  let data, dataReceived;

  for (let x = 0; x <= 3; x++) {
    try {
      data = await spotifyApi.getArtist(artist);
      dataReceived = true;
      break;
    } catch (err) {
      refreshSpoifyAccessToken();
    }
  }

  if (!dataReceived) return "An error occurred while retrieving artist data";

  return {
    type: SpotifyURLType.ARTIST,
    description: {},
  };
}

/**
 * starts playlist download
 *
 * @param playlistUrl the playlist identifier to be used in download
 * @throws error if error occurred while fetching data, this can be caused by network
 */
async function performPlaylistDownloadAction(playlistUrl) {
  let playlist = playlistUrl.substring("https://open.spotify.com/playlist/".length, playlistUrl.length);
  let data, dataReceived;

  for (let x = 0; x <= 3; x++) {
    try {
      data = await spotifyApi.getPlaylist(playlist);
      dataReceived = true;
      break;
    } catch (err) {
      refreshSpoifyAccessToken();
    }
  }

  if (!dataReceived) return "An error occurred while retrieving playlist data";

  const body = data.body;
  const playListName = body["name"];
  const tracks = body["tracks"];

  let trackCollection = tracks["items"]
    .map((i) => i.track)
    .map((tr) => {
      return { songTitle: tr["name"], artistNames: tr["artists"].map((artist) => artist.name) };
    });

  return {
    type: SpotifyURLType.PLAYLIST,
    description: {
      playListName,
      trackCollection,
    },
  };
}

/**
 * starts track download
 *
 * @param track the track identifier to be used in download
 * @throws error if error occurred while fetching data, this can be caused by network
 */
async function performTrackDownloadAction(trackUrl) {
  let track = trackUrl.substring("https://open.spotify.com/track/".length, trackUrl.length);
  let data, dataReceived;

  for (let x = 0; x <= 3; x++) {
    try {
      data = await spotifyApi.getTrack(track);
      dataReceived = true;
      break;
    } catch (err) {
      refreshSpoifyAccessToken();
    }
  }

  if (!dataReceived) return "An Error occurred while retrieving track data";

  const body = data.body;
  let songTitle = body["name"];
  let artists = body["artists"];
  let artistNames = [];

  artistNames = artists.map((artist) => artist["name"]);

  return {
    type: SpotifyURLType.TRACK,
    description: [
      {
        songTitle,
        artistNames,
      },
    ],
  };
}

/**
 * Starts donwloading tracks available at the the link url in the clipboard
 */
function beginDownloads(args) {}

/**
 * Creates a download window with the data speified
 */
function createDownloadWindow() {
  if (download_window) return;

  download_window = new BrowserWindow({
    title: "Confirm the list",
    parent: smd_window,
    show: false,
    modal: true,
    width: 700,
    height: 500,
    resizable: false,
    backgroundColor: "#0c0b0b",
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "../preload.js"),
    },
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

/**
 * Spawns up a new SMD window with a limitations of 1 winodws
 */
function createApplicationWindow(state) {
  // only 1 window is allowed to be spawned
  if (smd_window) return;

  smd_window = new BrowserWindow({
    show: false,
    backgroundColor: "#0c0b0b",
    frame: false,
    minWidth: 900,
    minHeight: 400,
    width: 1000,
    height: 620,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "../preload.js"),
    },
  });

  Menu.setApplicationMenu(menu);
  smd_window.loadFile(path.join("app", "pages", "index.html"));
  smd_window.once("ready-to-show", smd_window.show);
  smd_window.on("close", (event) => {
    event.preventDefault();
    // let [x, y] = smd_window.getPosition();
    // let [width, height] = smd_window.getSize();
    // Settings.setState("window-state", `${{ x, y, width, height }}`);
    smd_window.destroy();
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
      preload: path.join(__dirname, "../preload.js"),
    },
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
  const downloadDir = path.join(app.getPath("music"), app.getName(), "download");
  const thumbnailDir = path.join(downloadDir, ".thumb");

  fs.open(downloadDir, "r+", (err, _fd) => {
    if (err) {
      if (err.code === "EEXIST") return;
      else if (err.code === "ENOENT") {
        fs.mkdirSync(thumbnailDir, { recursive: true });
      } else console.log(err.code);
    }
  });
}
