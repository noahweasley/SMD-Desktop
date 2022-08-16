"use-strict";

const settings = require("node-user-settings");
const browsers = require("../browsers")(settings);
const { app } = require("electron");
const { mainWindow} = browsers;
const database = require("./database")
const path = require("path")
const fs = require("fs")

settings.initialize({
  dir: path.join(app.getPath("userData"), "User", "Preferences")
});

require("../events")(settings, browsers, database);

app.whenReady().then(async () => {
  createAppFiles();
  let windowState = await settings.getState("window-state");
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
