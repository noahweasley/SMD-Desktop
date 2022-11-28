"use-strict";

const { app } = require("electron");
const { mkdir, open } = require("fs");
const { join } = require("path");

/**
 * create the download directory
 */
module.exports.createAppFiles = function () {
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
};
