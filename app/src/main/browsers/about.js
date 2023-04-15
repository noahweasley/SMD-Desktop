const { BrowserWindow, app } = require("electron");
const { join } = require("path");

let aboutWindow;

module.exports.init = function () {
  // only 1 window is allowed to be spawned
  if (aboutWindow) return aboutWindow.focus();

  aboutWindow = new BrowserWindow({
    title: `About ${app.getName()}`,
    show: false,
    width: 700,
    height: 500,
    resizable: false,
    backgroundColor: "#0c0b0b",
    webPreferences: {
      contextIsolation: true,
      preload: join(__dirname, "../../common/preload.js")
    }
  });

  aboutWindow.setMenu(null);
  aboutWindow.loadFile(join("app", "src", "views", "pages", "about.html"));
  aboutWindow.once("ready-to-show", aboutWindow.show);
  aboutWindow.on("closed", () => (aboutWindow = null));
};

module.exports.getWindow = () => aboutWindow;
