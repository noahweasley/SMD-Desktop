"use-strict";

const { app } = require("electron");
const { mkdir, open, watch } = require("fs");
const { join } = require("path");

function __exports() {
  /**
   * create the download directory
   */
  function createAppFilesDirectory() {
    const downloadDirectory = getDownloadsDirectory();
    const thumbnailDirectory = getThumbnailDirectory(downloadDirectory);
    const tempThumbDirectory = getTempThumbDirectory(downloadDirectory);

    open(downloadDirectory, "r+", (err) => {
      if (err) {
        if (err.code === "EEXIST") return;
        else if (err.code === "ENOENT") {
          mkdir(thumbnailDirectory, { recursive: true }, () => {});
          mkdir(tempThumbDirectory, { recursive: true }, () => {});
        } else console.log(err.code);
      }
    });
  }

  /**
   * @returns the music files download directory for the application
   */
  function getDownloadsDirectory() {
    return join(app.getPath("music"), app.getName(), "Download");
  }

  /**
   * Returns the thumbnail directory of the application and appends the `parentDirectory` path if it is present or uses the default download path
   *
   * @param {string} parentDirectory the music files download directory for the application
   * @returns the thumbnail directory
   */
  function getThumbnailDirectory(parentDirectory) {
    return join(parentDirectory || getDownloadsDirectory(), ".thumb");
  }

  /**
   * Returns the thumbnail directory of the application and appends the `parentDirectory` path if it is present or uses the default download path
   *
   * @param {string} parentDirectory the music files download directory for the application
   * @returns the temporary thumbnail directory
   */
  function getTempThumbDirectory(parentDirectory) {
    return join(parentDirectory || getDownloadsDirectory(), ".temp", ".thumb");
  }

  /**
   * Delays program
   * @param {number} timeout delay period in milliseconds
   * @returns a Promise that resolves after `timeout` milliseconds
   */
  function delay(timeout) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, timeout);
    });
  }

  /**
   * Watch a file and detect file changes
   *
   * @param {string} filePath
   * @returns a Promise that resolves when there is a detected file change
   */
  function watchFileForChanges(filePath) {
    return new Promise((resolve) => {
      watch(filePath, (eventType, filename) => {
        if (filename && eventType === "change") {
          resolve(filename);
        }
      });
    });
  }

  return {
    createAppFilesDirectory,
    getDownloadsDirectory,
    getTempThumbDirectory,
    getThumbnailDirectory,
    delay,
    watchFileForChanges
  };
}

module.exports = __exports();
