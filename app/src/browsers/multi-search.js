"use-strict";

const path = require("path");
const { BrowserWindow } = require("electron");

module.exports.init = function (parent) {
  let search_window;

  function init() {
    if (search_window) return;

    search_window = new BrowserWindow({
      title: "Confirm Download List",
      parent: BrowserWindow.getFocusedWindow(),
      show: false,
      modal: true,
      width: 700,
      height: 500,
      resizable: isDebugging,
      backgroundColor: "#0c0b0b",
      webPreferences: {
        contextIsolation: true,
        preload: path.join(__dirname, "../preload.js")
      }
    });

    search_window.setMenu(null);
    search_window.loadFile(path.join("app", "src", "views", "pages", "search.html"));
    search_window.once("ready-to-show", search_window.show);
    // listening for close event on download window helped to solve quick window flash issue.
    // Adding hide() on window was the key to solve this issue, but I don't have an idea why
    // the quick flash issue occurrs.
    search_window.on("close", (event) => {
      event.preventDefault();
      search_window.hide();
      queryDownloadData = null;
      search_window.destroy();
      search_window = null;
    });
  }

  const getWindow = () => search_window;

  return { init, getWindow };
};
