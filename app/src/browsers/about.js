"use-strict";

const { BrowserWindow, app } = require("electron");
const path = require("path");

module.exports = function (...args) {
  let about_window;

  function init() {
    // only 1 window is allowed to be spawned
    if (about_window) {
      about_window.focus();
      return;
    }

    about_window = new BrowserWindow({
      title: `About ${app.getName()}`,
      show: false,
      width: 700,
      height: 500,
      resizable: false,
      backgroundColor: "#0c0b0b",
      webPreferences: {
        contextIsolation: true,
        preload: path.join(__dirname, "../preload.js")
      }
    });

    about_window.setMenu(null);
    about_window.loadFile(path.join("app", "src", "views", "pages", "about.html"));
    about_window.once("ready-to-show", about_window.show);
    about_window.on("closed", () => (about_window = null));
  }

  const getWindow = () => about_window;

  return { init, getWindow };
};
