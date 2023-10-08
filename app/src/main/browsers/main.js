const { BrowserWindow, Menu, ipcMain, dialog, app, shell } = require("electron");
const { join } = require("path");
const menu = require("../menu/main");
const { checkForUpdates } = require("../util/auto-update");

module.exports = function (settings) {
  let smdWindow;

  async function init() {
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
      width: winState.width ? winState.width : 970,
      height: winState.height ? winState.height : 575,
      webPreferences: {
        contextIsolation: true,
        preload: join(__dirname, "../../common/preload.js")
      }
    });

    Menu.setApplicationMenu(menu);
    smdWindow.loadFile(join("app", "src", "views", "pages", "index.html"));

    smdWindow.once("ready-to-show", async () => {
      smdWindow.show();
      // to prevent glitch on window maximize, after displaying the window, then maximize it
      if (winState.isMaximized) smdWindow.maximize();

      const updateInfo = await checkForUpdates();
      if (updateInfo !== null) {
        const returnedValue = await dialog.showMessageBox(getWindow(), {
          noLink: true,
          title: "Update available",
          type: "info",
          message: `Upgrade ${app.getName()} from v${app.getVersion()} to the latest version; ${updateInfo.tag_name}?`,
          defaultId: 0,
          buttons: ["Proceed", "Not now"]
        });

        if (returnedValue.response === 0) {
          let downloadLink;

          if (process.platform === "win32") {
            downloadLink = "https://noahweasley.github.io/SMD-Desktop/website/pages/downloads/windows.html";
          } else if (process.platform === "darwin") {
            downloadLink = "https://noahweasley.github.io/SMD-Desktop/website/pages/downloads/mac-os.html";
          } else {
            downloadLink = "https://noahweasley.github.io/SMD-Desktop/website/pages/downloads/linux.html";
          }

          shell.openExternal(downloadLink);
        }
      }
    });

    smdWindow.on("close", async (event) => {
      event.preventDefault();
      const [x, y] = smdWindow.getPosition();
      const [width, height] = smdWindow.getSize();
      await settings.setState("window-state", JSON.stringify({ x, y, width, height, isMaximized: smdWindow.isMaximized() }));
      smdWindow?.destroy();
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
