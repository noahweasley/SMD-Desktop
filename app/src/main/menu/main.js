const { app, Menu } = require("electron");

module.exports = app.isPackaged
  ? null
  : Menu.buildFromTemplate([
      {
        label: "Reload",
        role: "reload"
      },
      {
        label: "Force Reload",
        role: "forceReload"
      },
      {
        label: "Toggle Dev tools",
        role: "toggleDevTools"
      },
      {
        label: "Exit",
        accelerator: "ESC",
        click: () => app.quit()
      },
      {
        label: "Restore",
        accelerator: "F1",
        click: (_i, win) => win.restore()
      },
      {
        label: "Maximize",
        accelerator: "F2",
        click: (_i, win) => win.maximize()
      },
      {
        label: "Minimize",
        accelerator: "F3",
        click: (_i, win) => win.minimize()
      }
    ]);
