"use-strict";

const { downloadMatchingTrack } = require("../server/youtube-dl");
const { States } = require("../database/constants");
const { IllegalStateError } = require("../util/error");

/**
 * A single Download Task
 *
 * @param {JSON} configOptions { link, title }
 */
module.exports = function (configOptions) {
  let state = States.INACTIVE;
  let downloadStream;

  async function wait() {
    state = States.PENDING;
    return await registerDownloadOp();
  }

  function pause() {
    state = States.PAUSED;
    downloadStream?.pause();
  }

  function resume() {
    if (state !== States.PENDING || state !== States.PAUSED) {
      throw new IllegalStateError("Illegal download state, cannot resume a download that wasn't previously running");
    }
    state = States.ACTIVE;
    downloadStream?.resume();
  }

  function cancel() {
    state = States.INACTIVE;
    downloadStream?.destroy();
  }

  async function start() {
    if (state == States.ACTIVE) {
      throw new IllegalStateError("Download task is already active");
    } else {
      state = States.ACTIVE;
      return await registerDownloadOp();
    }
  }

  async function registerDownloadOp() {
    downloadStream = await downloadMatchingTrack(configOptions);
    console.log("Using Options", configOptions);
    console.log("\n\n");
    console.log("Stream", downloadStream);
    downloadStream?.on("error", (error) => console.log(`Fatal error occurred, cannot download, cause: ${error}`));
    return downloadStream;
  }

  return { pause, resume, wait, cancel, start };
};
