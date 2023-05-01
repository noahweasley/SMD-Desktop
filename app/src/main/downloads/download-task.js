const { downloadMatchingTrack } = require("../server/youtube-dl");
const States = require("./states");
const { IllegalStateError } = require("../util/error");

/**
 * A single Download Task
 *
 * @param {JSON} configOptions parameters used in the downloads `=>` { request, title task, targetWindow }
 */
module.exports = function (configOptions) {
  let state = States.INACTIVE;
  let pendingTask = null;
  let stream;

  /**
   * @returns the download that was postponed
   */
  async function wait() {
    state = States.PENDING;
    pendingTask = downloadMatchingTrack;
  }

  function pause() {
    if (state !== States.PENDING || state !== States.PAUSED) {
      throw new IllegalStateError("Illegal download state, cannot resume a download that wasn't previously running");
    }
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
    if (state === States.ACTIVE) {
      throw new IllegalStateError("Download task is already active");
    } else {
      state = States.ACTIVE;
      let result;
      if (pendingTask) {
        result = pendingTask();
        pendingTask = null;
      } else {
        result = await downloadMatchingTrack({ ...configOptions });
      }
      return result;
    }
  }

  return { pause, resume, wait, cancel, start };
};
