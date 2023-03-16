const { ipcMain: ipcMain0 } = require("electron");

module.exports = function (timeout = 25000, ipcMain) {
  const ipcMain1 = ipcMain || ipcMain0;
  setInterval(() => ipcMain1.emit("reload-current-window"), timeout);
};
