"use-strict";

const { BrowserWindow, Menu, ipcMain } = require("electron");
const { join } = require("path");
const menu = require("../main/menu");

module.exports = function (settings) {
  let smdWindow;

  async function init() {
    // only 1 window is allowed to be spawned

    if (smdWindow) return smdWindow.focus();

    let winState = await settings.getState("window-state", {});

    try {
      winState = JSON.parse(winState);
    } catch (error) {
      winState = {};
    }

    smdWindow = new BrowserWindow({
      x: winState.x,
      y: winState.y,
      show: false,
      backgroundColor: "#0c0b0b",
      frame: false,
      minWidth: 900,
      minHeight: 400,
      width: winState.width ? winState.width : 1000,
      height: winState.height ? winState.height : 620,
      webPreferences: {
        contextIsolation: true,
        preload: join(__dirname, "../preload.js")
      }
    });

    Menu.setApplicationMenu(menu);
    smdWindow.loadFile(join("app", "src", "views", "pages", "index.html"));

    smdWindow.once("ready-to-show", () => {
      smdWindow.show();
      // to prevent glitch on window maximize, after displaying the window, then maximize it
      if (winState.isMaximized) smdWindow.maximize();
    });

    smdWindow.on("close", async (event) => {
      event.preventDefault();
      const [x, y] = smdWindow.getPosition();
      const [width, height] = smdWindow.getSize();
      const isCompleted = await settings.setState(
        "window-state",
        JSON.stringify({ x, y, width, height, isMaximized: smdWindow.isMaximized() })
      );
      if (isCompleted) smdWindow.destroy();
      smdWindow = null;
    });

    // window acton click
    ipcMain.on("action-click-event", (_event, id) => {
      if (id === "window-action-close") {
        smdWindow?.close();
      } else if (id === "window-action-minimize") {
        smdWindow?.minimize();
      } else {
        smdWindow.isNormal() ? smdWindow.maximize() : smdWindow.restore();
      }
    });
  }

  const getWindow = () => smdWindow;

  return { init, getWindow };
};
