
module.exports = function (ipcMain) {
  setInterval(() => ipcMain.emit("reload-current-window"), 25000);
};
