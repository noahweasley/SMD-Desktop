"use-strict";

const { downloadMatchingTrack } = require("../server/youtube-dl");
const { States } = require("../database/constants");

/**
 * A single Download Task
 *
 * @param {JSON} options { link, title }
 */
module.exports = function (options) {
  let state = States.INACTIVE;
  let { win } = options;

  function wait() {
    state = States.PENDING;
    return registerDownloadOp();
  }

  function pause() {
    state = States.PAUSED;
    downloadStream?.pause();
  }

  function resume() {
    // if (state !== States.PENDING || state !== States.PAUSED) {
    //   throw new Error("Illegal download state, cannot resume a download that wasn't previously running");
    // }
    state = States.ACTIVE;
    downloadStream?.resume();
  }

  function cancel() {
    state = States.INACTIVE;
    downloadStream?.destroy();
  }

  function start() {
    if (state == States.ACTIVE) {
      throw new Error("Download task is already active");
    } else {
      state = States.ACTIVE;
      return registerDownloadOp();
    }
  }

  async function registerDownloadOp() {
    let downloadStream = await downloadMatchingTrack(options.request);

    downloadStream.on("binaries-downloading", () => win.webContents.send("show-binary-download-dialog"));
    downloadStream.on("binaries-downloaded", () => win.webContents.send("close-binary-download-dialog"));

    downloadStream.on("error", (err) => {
      console.error(err);
    });

    return downloadStream;
  }

  return { pause, resume, wait, cancel, start };
};
