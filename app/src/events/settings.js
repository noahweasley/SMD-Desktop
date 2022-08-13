"use-strict";

const { ipcMain } = require("electron");

module.exports = function (settings, browsers, database, queryDownloadData) {
  // settings requests
  ipcMain.handle("get-states", async (_event, args) => {
    return await settings.getState(args[0], args[1]);
  });

  // settings request
  ipcMain.handle("get-multiple-states", async (_event, args) => {
    return await settings.getStates(args);
  });

  // settings requests
  ipcMain.handle("set-states", async (_event, args) => {
    return await settings.setState(args[0], args[1]);
  });
};
