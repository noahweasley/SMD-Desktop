"use-strict";

const downloadTask = require("./download-task");
const lock = require("./lock");

module.exports = function (config) {
  const { targetWindow, maxParallelDownloads } = config;

  const locker = lock(maxParallelDownloads);

  let downloadTaskQueue = [];
  // tasks => streams[]
  let activeDownloadTasks = [];
  let inactiveDownloadTasks = [];

  /**
   * Clears the task queue
   */
  function clearTaskQueue() {
    downloadTaskQueue = [];
  }

  /**
   * Enqueue a download task
   *
   * @param {JSON} request a download request in the format; `{ sourceUrl, destPath }`
   */
  function enqueueTask(request = {}) {
    let task = downloadTask({ targetWindow, request });
    downloadTaskQueue.push(task);
    return task;
  }

  /**
   * Enqueue a download task
   *
   * @param {array} request a download request in the format; `{ sourceUrl, destPath }`
   */
  function enqueueTasks(requests = []) {
    requests.forEach((request) => enqueueTask(request));
    return downloadTaskQueue;
  }

  function pauseAll() {
    downloadTaskQueue.forEach((task) => task.pause());
  }

  function resumeAll() {
    downloadTaskQueue.forEach((downloadTask) => {
      if (locker.acquireLock()) {
        let downloadStream1 = downloadTask.resume();
        activeDownloadTasks.push(downloadStream1);
      } else {
        let downloadStream2 = downloadTask.wait();
        inactiveDownloadTasks.push(downloadStream2);
      }
    });
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
    let downloadStreams = []; // contains both active and inactive downloads

    downloadTaskQueue.forEach((downloadTask) => {
      if (locker.acquireLock()) {
        let activeDownloadStream = downloadTask.start();
        downloadStreams.push(activeDownloadStream);
        activeDownloadTasks.push(activeDownloadStream);
      } else {
        let inactiveDownloadStream = downloadTask.wait();
        downloadStreams.push(inactiveDownloadStream);
        inactiveDownloadTasks.push(inactiveDownloadStream);
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
