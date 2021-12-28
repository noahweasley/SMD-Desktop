"use-strict";

const Settings = require("../background/settings/settings");
const { refreshSpoifyAccessToken, authorizeApp } = require("../background/authorize");
const { SpotifyURLType, getSpotifyURLType } = require("../background/util");
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
  let linkType;
  switch (arg) {
    case "#music":
      linkType = `file://${app.getPath("music")}`;
      break;
    case "#video":
      linkType = `file://${app.getPath("videos")}`;
      break;
    default:
      linkType = arg;
  }

  // then open link in default app
  shell.openExternal(linkType);
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

// ... clipboard content request
ipcMain.handle("clipboard-request", () => {
  const clipboardContent = clipboard.readText();
  const spotifyLinkRegex = new RegExp("https://open.spotify.com");

  spotifyApi.setClientId(Settings.getState("spotify-user-client-id"));
  spotifyApi.setClientSecret(Settings.getState("spotify-user-client-secret"));
  spotifyApi.setAccessToken(Settings.getState("spotify-access-token"));
  spotifyApi.setRefreshToken(Settings.getState("spotify-refresh-token"));

  let data;

  try {
    if (spotifyLinkRegex.test(clipboardContent)) {
      // then ...
      let spotifyURLType = getSpotifyURLType(clipboardContent);
      switch (spotifyURLType) {
        case SpotifyURLType.TRACK:
          data = performTrackDownloadAction(clipboardContent);
        case SpotifyURLType.ALBUM:
          data = performAlbumDownloadAction(clipboardContent);
        case SpotifyURLType.ARTIST:
          data = performArtistDownloadAction(clipboardContent);
        case SpotifyURLType.PLAYLIST:
          data = performPlaylistDownloadAction(clipboardContent);
        default:
          throw new Error(`${spotifyURLType} is not supported yet`);
      }
    } else {
      // ... display modal dialog with details of error
      dialog.showErrorBox(
        "Clipboard content not a Spotify link",
        "Go to Spotify and copy playlist or song link, then click 'Paste URL'"
      );
    }
  } catch (err) {
    console.log("An Error occurred ", err);
  } finally {
    // show download details window
    createDownloadWindow(data);
  }
});

/**
 * starts album downlaod
 *
 * @param albumUrl the album identifier to be used in download
 * @throws error if error occurred while fetching data, this can be caused by network
 */
async function performAlbumDownloadAction(albumUrl, _limits) {
  let album = artistUrl.substring("https://open.spotify.com/album/".length, albumUrl.length);
  let refreshCount = 0;
  let data;

  while (true) {
    try {
      data = await spotifyApi.getAlbum(album);
      break;
    } catch (err) {
      if (++refreshCount === 3) throw new Error("An error occurred while retrieving artist data");
      refreshSpoifyAccessToken();
    }
  }

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
  let refreshCount = 0;
  let data;

  for (let x = 0; x <= 3; x++) {
    try {
      data = await spotifyApi.getArtist(artist);
      break;
    } catch (err) {
      if (++refreshCount === 3) throw new Error("An error occurred while retrieving artist data");
      refreshSpoifyAccessToken();
    }
  }

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
  let refreshCount = 0;
  let data;

  while (true) {
    try {
      data = await spotifyApi.getPlaylist(playlist);
      break;
    } catch (err) {
      if (++refreshCount === 3) throw new Error("An error occurred while retrieving artist data");
      refreshSpoifyAccessToken();
    }
  }

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

  if (!dataReceived) return;

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
 * Creates a download window with the data speified
 *
 * @param data the data to be displayed on the window
 */
function createDownloadWindow(data) {
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
  download_window.on("closed", () => (download_window = null));
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
  const downloadDir = path.join(app.getPath("music"), app.getName());

  fs.open(downloadDir, "wx", (err, _fd) => {
    // create downloads directory
    function createDownloadsDirectory() {
      fs.mkdir(
        downloadDir,
        {
          recursive: true,
        },
        function (err) {
          if (err) console.log("An error occurred while creating directory");
        }
      );
    }

    if (err) {
      if (err.code === "EEXIST") return;
      else if (err.code === "ENOENT") {
        createDownloadsDirectory();
      } else console.log(err.code);
    }
  });
}
