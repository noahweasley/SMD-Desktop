"use-strict";

const { join } = require("path");
const { mkdir, open } = require("fs");
const { app } = require("electron");

// ssmd was used to make the user not be able to open and edit the file created

const settings = require("node-user-settings")({
  preferenceFileDir: join(app.getPath("userData"), "User", "Preferences"),
  fileName: "Settings",
  fileExt: "json"
});

const browsers = require("../browsers")(settings);
const { mainWindow } = browsers;
const database = require("./database");

require("../events")(settings, browsers, database);

app.whenReady().then(() => {
  createAppFiles();
  mainWindow.init();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow.init(windowState);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

/**
 * create the download directory
 */
function createAppFiles() {
  const downloadDir = join(app.getPath("music"), app.getName(), "Download");
  const thumbnailDir = join(downloadDir, ".thumb");
  const tempThumbDir = join(downloadDir, ".temp", ".thumb");

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
