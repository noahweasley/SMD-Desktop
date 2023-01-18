"use-strict";

const { downloadMatchingTrack } = require("../server/youtube-dl");
const { States } = require("../database/constants");

module.exports = function (options) {
  let state = States.PENDING;
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
    state = States.PAUSED;
    downloadStream?.pause();
  }

  function resume() {
    state = States.ACTIVE;
    downloadStream?.resume();
  }

  function cancel() {
    state = States.FAILED;
    downloadStream?.destroy();
  }

  function start() {
    if (state == States.ACTIVE) {
      throw new Error("Download task is already active");
    } else {
      state = States.ACTIVE;
      let options = {};
      registerDownloadOp(options);
    }
  }

  async function registerDownloadOp(options) {
    let stream = await downloadMatchingTrack(options);
    downloadStream = stream;
    stream.on("binaries-downloading", () => win.webContents.send("show-binary-download-dialog"));
    stream.on("binaries-downloaded", () => win.webContents.send("close-binary-download-dialog"));
    stream.on("error", (err) => {
      console.error(err);
      downloadCallbackQueue.forEach((callback) => callback(err));
    });
    
    return stream;
  }

  function wait() {
    state = States.PENDING;
  }

  return { addDownloadCallback, pause, resume, wait, cancel, start, getListPosition };
};
