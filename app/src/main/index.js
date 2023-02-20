"use-strict";

const { join } = require("path");
const { app, BrowserWindow } = require("electron");
const { createAppFilesDirectory } = require("./util");
const settings = require("node-user-settings").defaults;

const preferenceFilePath = join(app.getPath("userData"), "User", "Preferences", "Settings.json");
settings.setDefaultPreferenceFilePath(preferenceFilePath);

const browsers = require("../browsers")(settings);
const { mainWindow } = browsers;
const database = require("./database");

require("../events")(settings, browsers, database);

app.whenReady().then(function () {
  createAppFilesDirectory();
  mainWindow.init();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow.init();
  });
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});
