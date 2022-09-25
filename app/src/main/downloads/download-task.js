"use-strict";

const { downloadMatchingTrack } = require("../server/youtube-dl");
// const async = require("async");

/**
 * Possible states of a download task
 */
const _States = Object.freeze({
  PENDING: 0,
  ACTIVE: 1,
  PAUSED: 2,
  COMPLETED: 3,
  FAILED: 4
});

module.exports.States = _States;

module.exports = function (options) {
  // let c_window = BrowserWindow.getFocusedWindow();
  let state = _States.PENDING;
  let downloadCallbackQueue = [];
  let { win, request, listPos } = options;
  let requestUrl = request.url;
  let progress;
  let downloadStream;

  function addDownloadCallback(callback) {
    downloadCallbackQueue.push(callback); // (error, pos, progress)
  }

  const getListPosition = () => downloadListPos;

  function pause() {
    state = _States.PAUSED;
    downloadStream?.pause();
  }

  function resume() {
    state = _States.ACTIVE;
    downloadStream?.resume();
  }

  function cancel() {
    state = _States.FAILED;
    downloadStream?.destroy();
  }

  function start() {
    if (state == _States.ACTIVE) {
      throw new Error("Download task is already active");
    } else {
      state = _States.ACTIVE;
      let options = {};
      registerDownloadOp(options);
    }
  }

  async function registerDownloadOp(options) {
    let stream = await downloadMatchingTrack(options);
    downloadStream = stream;
    // bd => binaries downloading
    stream.on("binaries-downloading", () => win.webContents.send("show-bd-dialog"));
    stream.on("binaries-downloaded", () => win.webContents.send("close-bd-dialog"));
    stream.on("error", (err) => {
      console.error(err);
      downloadCallbackQueue.forEach((callback) => callback(err));
    });
  }

  function wait() {
    state = _States.PENDING;
  }

  return { addDownloadCallback, pause, resume, wait, cancel, start, getListPosition };
};
