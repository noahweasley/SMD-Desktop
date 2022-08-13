"use-strict";

const { BrowserWindow } = require("electron");
const path = require("path");

module.exports = function () {
  let search_window_2;

  function init() {
    if (search_window_2) return;

    search_window_2 = new BrowserWindow({
      title: "Confirm Download List",
      parent: BrowserWindow.getFocusedWindow(),
      show: false,
      modal: true,
      width: 700,
      height: 500,
      resizable: false,
      backgroundColor: "#0c0b0b",
      webPreferences: {
        contextIsolation: true,
        preload: path.join(__dirname, "../preload.js")
      }
    });

    search_window_2.setMenu(null);
    search_window_2.loadFile(path.join("app", "src", "views", "pages", "search-single.html"));
    search_window_2.once("ready-to-show", search_window_2.show);
    // listening for close event on download window helped to solve quick window flash issue.
    // Adding hide() on window was the key to solve this issue, but I don't have an idea why
    // the quick flash issue occurrs.
    search_window_2.on("close", (event) => {
      event.preventDefault();
      search_window_2.hide();
      search_window_2.destroy();
      search_window_2 = null;
    });
  }

  const getWindow = () => search_window_2;

  return { init, getWindow };
};
