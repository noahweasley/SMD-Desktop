const { app, BrowserWindow, dialog, shell } = require("electron");
if (!app.isPackaged) require("dotenv").config();
const { join } = require("path");
const { createAppFilesDir } = require("./util/files");
const settings = require("node-user-settings").defaults;
const { sweepEmptyFiles } = require("./util/debug");

// handle squirrel events on Windows
if (require("electron-squirrel-startup")) return;

const preferenceFilePath =
  process.env.PREF_FILEPATH || join(app.getPath("userData"), "User", "Preferences", "Settings.json");

settings.setDefaultPreferenceFilePath(preferenceFilePath);

const browsers = require("../main/browsers")(settings);
const { mainWindow } = browsers;
const database = require("./database");

require("../main/events")(settings, browsers, database);

app.whenReady().then(async () => {
  await sweepEmptyFiles(false);
  createAppFilesDir();
  mainWindow.init();

  app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && mainWindow.init());
});

app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
