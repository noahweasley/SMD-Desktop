"use-strict";

const { downloadMatchingTrack } = require("../server/youtube-dl");
const { States } = require("../database/constants");

/**
 * A single Download Task
 *
 * @param {JSON} options { link, title }
 */
module.exports = function (options) {
  let state = States.PENDING;
  let downloadEventQueue = [];
  let { win, request, listPos } = options;
  let requestUrl = request.url;
  let downloadStream;

  const getListPosition = () => downloadListPos;

  function wait() {
    state = States.PENDING;
  }

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
      let options = { link: "", title: "" };

      return registerDownloadOp(options);
    }
  }

  async function registerDownloadOp(options) {
    let stream = await downloadMatchingTrack(options);
    downloadStream = stream;
    stream.on("binaries-downloading", () => win.webContents.send("show-binary-download-dialog"));
    stream.on("binaries-downloaded", () => win.webContents.send("close-binary-download-dialog"));
    stream.on("error", (err) => {
      console.error(err);
      downloadEventQueue.forEach((callback) => callback(err));
    });

    return stream;
  }

  return { pause, resume, wait, cancel, start, getListPosition };
};
