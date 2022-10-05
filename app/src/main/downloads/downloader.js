"use-strict";

const downloadTask = require("./download-task");

module.exports = function (config) {
  const { maxParallelDownloads, win } = config;
  let CONCURRENCY = maxParallelDownloads;

  let downloadTaskQueue = [],
    activeDownloadTasks = [];

  const getMaxParallelDownloads = () => maxParallelDownloads;

  function acquireLock() {
    if (CONCURRENCY) {
      --CONCURRENCY;
      return true;
    } else {
      return false;
    }
  }

  function releaseLock() {
    if (CONCURRENCY < maxParallelDownloads) {
      ++CONCURRENCY;
      return true;
    } else {
      return false;
    }
  }

  /**
   * Enqueue a download tast
   *
   * @param {*} request a download request in the format; `{ sourceUrl, destPath }`
   */
  function enqueueTask(request = {}, listPos = 0) {
    let task = downloadTask({ win, request, listPos });
    downloadTaskQueue.push(task);
    return task;
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

  /**
   * puts all the download tasks in their active state. If maxParallelDownloads is higher that the
   * number of download task on the dowload queue, then the remaining tasks enter their pending states
   */
  function initiateDownloads() {
    return new Promise(() => {
      for (let x = 0; x < downloadTaskQueue.length; x++) {
        if (acquireLock()) {
          downloadTaskQueue[x].start();
          activeDownloadTasks.push(downloadTaskQueue[x]);
        } else {
          downloadTaskQueue[x].wait();
        }
      }
    });
  }

  function pauseAll() {
    downloadTaskQueue.forEach((task) => task.pause());
  }

  function resumeAll() {
    return new Promise(() => {
      for (let x = 0; x < downloadTaskQueue.length; x++) {
        if (acquireLock()) {
          downloadTaskQueue[x].resume();
          activeDownloadTasks.push(downloadTaskQueue[x]);
        } else {
          downloadTaskQueue[x].wait();
        }
      }
    });
  }

  async function cancelAll() {
    downloadTaskQueue.forEach((task) => {
      if (releaseLock()) task.cancel();
    });

    activeDownloadTasks = [];
  }

  const activeTasks = () => activeDownloadTasks;

  return {
    getMaxParallelDownloads,
    initiateDownloads,
    enqueueTask,
    enqueueTasks,
    pauseAll,
    resumeAll,
    cancelAll,
    activeTasks
  };
};
