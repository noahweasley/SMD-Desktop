"use-strict";

const { BrowserWindow } = require("electron");
const { join } = require("path");

let download_window;

module.exports.init = function () {
  if (download_window) return download_window.focus();

  download_window = new BrowserWindow({
    title: "Confirm Search List",
    parent: BrowserWindow.getFocusedWindow(),
    show: false,
    modal: true,
    width: 700,
    height: 500,
    resizable: false,
    backgroundColor: "#0c0b0b",
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, "../preload.js")
    }
  });

  download_window.setMenu(null);
  download_window.loadFile(join("app", "src", "views", "pages", "downloads.html"));
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
};

module.exports.getWindow = () => download_window;
