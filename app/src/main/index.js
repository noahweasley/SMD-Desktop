const { app, BrowserWindow } = require("electron");
if (!app.isPackaged) require("dotenv").config();
const { join } = require("path");
const { createAppFilesDir, getDownloadsDir } = require("./util/files");
const settings = require("node-user-settings").defaults;

const preferenceFilePath =
  process.env.PREF_FILEPATH || join(app.getPath("userData"), "User", "Preferences", "Settings.json");

settings.setDefaultPreferenceFilePath(preferenceFilePath);

// delete any empty files
if (!app.isPackaged && process.env.CAN_SWEEP_EMPTY_FILES) require("clean-sweep").sweep(getDownloadsDir());
// check for app updates
require("update-electron-app")();
// handle squirrel events on Windows
if (require("electron-squirrel-startup")) return;

const browsers = require("../main/browsers")(settings);
const { mainWindow } = browsers;
const database = require("./database");

require("../main/events")(settings, browsers, database);

app.whenReady().then(() => {
  createAppFilesDir();
  mainWindow.init();

  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && mainWindow.init());
});

app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
