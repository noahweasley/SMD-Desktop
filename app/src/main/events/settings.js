const { ipcMain } = require("electron");

module.exports = function (settings) {
  // settings; get a single state entry
  ipcMain.handle("get-states", async (_event, args) => await settings.getState(args[0], args[1]));

  // settings; get multiple state entry
  ipcMain.handle("get-multiple-states", async (_event, args) => await settings.getStates(args));

  // settings; set single state entry
  ipcMain.handle("set-states", async (_event, args) => await settings.setState(args[0], args[1]));

  // settings; set multiple state entry
  ipcMain.handle("set-multiple-states", async (_event, args) => await settings.setStates(args[0], args[1]));
};
