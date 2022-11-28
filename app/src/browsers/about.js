"use-strict";

const { BrowserWindow, app } = require("electron");
const { join } = require("path");

let about_window;

module.exports.init = function () {
  // only 1 window is allowed to be spawned
  if (about_window) return about_window.focus();

  about_window = new BrowserWindow({
    title: `About ${app.getName()}`,
    show: false,
    width: 700,
    height: 500,
    resizable: false,
    backgroundColor: "#0c0b0b",
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, "../preload.js")
    }
  });

  about_window.setMenu(null);
  about_window.loadFile(join("app", "src", "views", "pages", "about.html"));
  about_window.once("ready-to-show", about_window.show);
  about_window.on("closed", () => (about_window = null));
};

module.exports.getWindow = () => about_window;
