const { BrowserWindow } = require("electron");
const { join } = require("path");
const { isWindowDebugEnabled } = require("../util/debug");

let downloadWindow;

module.exports.init = function () {
  if (downloadWindow) return downloadWindow.focus();

  downloadWindow = new BrowserWindow({
    title: "Confirm Search List",
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

  downloadWindow.setMenu(isWindowDebugEnabled() ? require("../menu/main") : null);
  downloadWindow.loadFile(join("app", "src", "views", "pages", "downloads.html"));
  downloadWindow.once("ready-to-show", downloadWindow.show);
  // listening for close event on download window helped to solve quick window flash issue.
  // Adding hide() on window was the key to solve this issue, but I don't have an idea why
  // the quick flash issue occurs.
  downloadWindow.on("close", (event) => {
    event.preventDefault();
    downloadWindow.hide();
    downloadWindow.destroy();
    downloadWindow = null;
  });
};

module.exports.getWindow = () => downloadWindow;
