"use-strict";

const downloadTask = require("./download-task");
const lock = require("./lock");

module.exports = function (config) {
  const { win, maxParallelDownloads } = config;
  const locker = lock(maxParallelDownloads);

  let downloadTaskQueue = [];
  let activeDownloadTasks = [];

  /**
   * Enqueue a download task
   *
   * @param {*} request a download request in the format; `{ sourceUrl, destPath }`
   */
  function enqueueTask(request = {}, listPos = 0) {
    let task = downloadTask({ win, request, listPos });
    downloadTaskQueue.push(task);
    return task;
  }

  /**
   * Clears the task queue
   */
  function clearTaskQueue() {
    downloadTaskQueue = [];
  }

  /**
   * Enqueue a download task
   *
   * @param {*} request a download request in the format; `{ sourceUrl, destPath }`
   */
  function enqueueTasks(requests = []) {
    for (let listPos = 0; listPos < requests.length; listPos++) {
      enqueueTask(requests[listPos], listPos);
    }

    return downloadTaskQueue;
  }

  function pauseAll() {
    downloadTaskQueue.forEach((task) => task.pause());
  }

  function resumeAll() {
    for (let x = 0; x < downloadTaskQueue.length; x++) {
      if (locker.acquireLock()) {
        downloadTaskQueue[x].resume();
        activeDownloadTasks.push(downloadTaskQueue[x]);
      } else {
        downloadTaskQueue[x].wait();
      }
    }
  }

  async function cancelAll() {
    downloadTaskQueue.forEach((task) => {
      if (locker.releaseLock()) {
        activeDownloadTasks.unshift();
        task.cancel();
      }
    });
  }

  const activeTasks = () => activeDownloadTasks;

  /**
   * Puts all the download tasks in their active state. If maxParallelDownloads is higher that the
   * number of download task on the download queue, then the remaining tasks enter their pending states
   */
  function initiateQueuedDownloads() {
    let downloadStreams = [];

    downloadTaskQueue.forEach((downloadTask) => {
      if (locker.acquireLock()) {
        downloadStreams.push(downloadTask.start());
      } else {
        downloadStreams.push(downloadTask.wait());
      }
    });

    return downloadStreams;
  }

  return {
    initiateQueuedDownloads,
    clearTaskQueue,
    enqueueTask,
    enqueueTasks,
    pauseAll,
    resumeAll,
    cancelAll,
    activeTasks
  };
};
