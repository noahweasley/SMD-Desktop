"use-strict";

const path = require("path");
const { mkdir, open } = require("fs");
const { app } = require("electron");

const settings = require("node-user-settings")({
  preferenceFileDir: path.join(app.getPath("userData"), "User", "Preferences")
});

const browsers = require("../browsers")(settings);
const { mainWindow } = browsers;
const database = require("./database");

require("../events")(settings, browsers, database);

app.whenReady().then(async () => {
  createAppFiles();
  mainWindow.init();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow.init(windowState);
  });
});

app.on("window-all-closed", () => {
  smd_window = null;
  if (process.platform !== "darwin") app.quit();
});

/**
 * create the download directory
 */
function createAppFiles() {
  const downloadDir = path.join(app.getPath("music"), app.getName(), "Download");
  const thumbnailDir = path.join(downloadDir, ".thumb");
  const tempThumbDir = path.join(downloadDir, ".temp", ".thumb");

  open(downloadDir, "r+", (err, _fd) => {
    if (err) {
      if (err.code === "EEXIST") return;
      else if (err.code === "ENOENT") {
        mkdir(thumbnailDir, { recursive: true }, (_err) => {});
        mkdir(tempThumbDir, { recursive: true }, (_err) => {});
      } else console.log(err.code);
    }
  });
}
