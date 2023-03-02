"use-strict";

const downloadTask = require("./download-task");
const lock = require("./lock");

module.exports = function (config) {
  const { targetWindow, maxParallelDownloads } = config;

  const locker = lock(maxParallelDownloads);

  let downloadTaskQueue = [];
  // tasks => streams[]
  const activeDownloadTasksStream = [];
  const inactiveDownloadTasksStream = [];

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
  function enqueueTask(task, request = {}) {
    const task0 = downloadTask({ task, targetWindow, request });
    downloadTaskQueue.push(task0);
    return task;
  }

  /**
   * Enqueue a download task
   *
   * @param {array} request  a download request in the format; `{ sourceUrl, destPath }`
   * @param {array} insertedColumnIds an array of objects with task id as keys
   */
  function enqueueTasks(insertedColumnIds = [], requests = []) {
    for (let x = 0; x < requests.length; x++) {
      enqueueTask(insertedColumnIds[x], requests[x]);
    }
    return downloadTaskQueue;
  }

  /**
   * Pause all active downloads
   */
  function pauseAll() {
    downloadTaskQueue.forEach((task) => task.pause());
  }

  /**
   * Resumes all downloads. If the number of active downloads are more than the max parallel download count,
   * automatically waits till a lock is released
   */
  function resumeAll() {
    downloadTaskQueue.forEach((downloadTask) => {
      if (locker.acquireLock()) {
        const downloadStream1 = downloadTask.resume();
        activeDownloadTasksStream.push(downloadStream1);
      } else {
        const downloadStream2 = downloadTask.wait();
        inactiveDownloadTasksStream.push(downloadStream2);
      }
    });
  }

  /**
   * Cancels all active downloads
   */
  async function cancelAll() {
    downloadTaskQueue.forEach((task) => {
      if (locker.releaseLock()) {
        activeDownloadTasksStream.unshift();
        task.cancel();
      }
    });
  }

  /**
   * @returns the number of active downloads
   */
  const activeTasks = () => activeDownloadTasksStream;

  /**
   * Puts all the download tasks in their active state. If maxParallelDownloads is higher that the
   * number of download task on the download queue, then the remaining tasks enter their pending states
   */
  function initiateQueuedDownloads() {
    const downloadStreams = []; // contains both active and inactive downloads

    downloadTaskQueue.forEach((downloadTask) => {
      if (locker.acquireLock()) {
        const activeDownloadStream = downloadTask.start();
        downloadStreams.push(activeDownloadStream);
        activeDownloadTasksStream.push(activeDownloadStream);
      } else {
        const inactiveDownloadStream = downloadTask.wait();
        downloadStreams.push(inactiveDownloadStream);
        inactiveDownloadTasksStream.push(inactiveDownloadStream);
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
