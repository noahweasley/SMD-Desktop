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
  let stream;

  async function wait() {
    state = States.PENDING;
    return await registerDownloadOp();
  }

  function pause() {
    state = States.PAUSED;
    stream?.pause();
  }

  function resume() {
    if (state !== States.PENDING || state !== States.PAUSED) {
      throw new IllegalStateError("Illegal download state, cannot resume a download that wasn't previously running");
    }
    state = States.ACTIVE;
    stream?.resume();
  }

  function cancel() {
    state = States.INACTIVE;
    stream?.destroy();
  }

  async function start() {
    if (state == States.ACTIVE) {
      throw new IllegalStateError("Download task is already active");
    } else {
      state = States.ACTIVE;
      const result = await registerDownloadOp();
      return result;
    }
  }

  async function registerDownloadOp() {
    const downloadParams = await downloadMatchingTrack(configOptions);
    stream = downloadParams.downloadStream;
    stream.on("error", () => console.info("An silent error was thrown"));
    return downloadParams;
  }

  return { pause, resume, wait, cancel, start };
};
