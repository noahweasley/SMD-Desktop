"use-strict";

const { BrowserWindow, Menu, ipcMain } = require("electron");
const menu = require("../main/menu");
const path = require("path");

module.exports = function (settings) {
  let smd_window;

  async function init() {
    // only 1 window is allowed to be spawned

    if (smd_window) return;

    let winState = await settings.getState("window-state", {});
    try {
      winState = JSON.parse(winState);
    } catch (error) {
      winState = {};
    }

    smd_window = new BrowserWindow({
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
        preload: path.join(__dirname, "../preload.js")
      }
    });

    Menu.setApplicationMenu(menu);

    smd_window.loadFile(path.join("app", "src", "views", "pages", "index.html"));

    // smd_window.webContents.openDevTools()
    smd_window.once("ready-to-show", () => {
      smd_window.show();
      // to prevent glith on window maximize, after displaying the window, then maximize it
      if (winState.isMaximized) {
        smd_window.maximize();
      }
    });

    smd_window.on("close", async (event) => {
      event.preventDefault();
      let [x, y] = smd_window.getPosition();
      let [width, height] = smd_window.getSize();
      let isCompleted = await settings.setState(
        "window-state",
        JSON.stringify({ x, y, width, height, isMaximized: smd_window.isMaximized() })
      );
      if (isCompleted) smd_window.destroy();
    });

    // window acton click
    ipcMain.on("action-click-event", (_event, id) => {
      if (id === "window-action-close") {
        smd_window?.close();
      } else if (id === "window-action-minimize") {
        smd_window?.minimize();
      } else {
        smd_window.isNormal() ? smd_window.maximize() : smd_window.restore();
      }
    });
  }

  const getWindow = () => smd_window;

  return { init, getWindow };
};
