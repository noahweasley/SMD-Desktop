/* eslint-disable no-undef */

const { BrowserWindow } = require("electron");
const { join } = require("path");
const { isWindowDebugEnabled } = require("../util/debug");

let searchWindow;

module.exports.init = function () {
  if (searchWindow) return searchWindow.focus();

  searchWindow = new BrowserWindow({
    title: "Confirm Download List",
    parent: BrowserWindow.getFocusedWindow(),
    show: false,
    modal: true,
    width: 700,
    height: 500,
    resizable: isWindowDebugEnabled(),
    backgroundColor: "#0c0b0b",
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, "../../common/preload.js")
    }
  });

  searchWindow.setMenu(isWindowDebugEnabled() ? require("../menu/main") : null);
  searchWindow.loadFile(join("app", "src", "views", "pages", "search.html"));
  searchWindow.once("ready-to-show", searchWindow.show);
  // listening for close event on download window helped to solve quick window flash issue.
  // Adding hide() on window was the key to solve this issue, but I don't have an idea why
  // the quick flash issue occurs.
  searchWindow.on("close", (event) => {
    event.preventDefault();
    searchWindow.hide();
    searchWindow.destroy();
    searchWindow = null;
  });
};

module.exports.getWindow = () => searchWindow;
