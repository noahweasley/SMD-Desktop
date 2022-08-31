"use-strict";

module.exports = function () {
  let downloadCallbackQueue = [];

  function addDownloadCallback(callback) {
    downloadCallbackQueue.push(callback);
  }

  async function pause() {}

  async function resume() {}

  async function cancel() {}

  return {
    addDownloadCallback,
    pause,
    resume,
    cancel
  };
};
