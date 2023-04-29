const { downloadMatchingTrack } = require("../server/youtube-dl");
const States = require("./states");
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
    return await startDownloadTask({ paused: true });
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
      const result = await startDownloadTask({ paused: false });
      return result;
    }
  }

  async function startDownloadTask(options) {
    const downloadParams = await downloadMatchingTrack({ ...options, ...configOptions });
    stream = downloadParams.downloadStream;
    stream.on("error", () => console.info("An silent error was thrown"));
    stream.on("end", () => {});

    return downloadParams;
  }

  return { pause, resume, wait, cancel, start };
};
