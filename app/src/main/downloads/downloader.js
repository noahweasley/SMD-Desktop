"use-strict";

const downloadTask = require("./download-task");
const lock = require("./lock");

module.exports = function (config) {
  const { win, maxParallelDownloads } = config;
  const locker = lock(maxParallelDownloads);

  let downloadTaskQueue = [];
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
   * @param {*} request a download request in the format; `{ sourceUrl, destPath }`
   */
  function enqueueTask(request = {}) {
        // request = {
    //   videoId: '-qBzKpsRJqo',
    //   videoUrl: 'https://www.youtube.com/watch?v=-qBzKpsRJqo',
    //   videoTitle: 'Adele   Hello'
    // }
    let task = downloadTask({ win, request });
    downloadTaskQueue.push(task);
    return task;
  }

  /**
   * Enqueue a download task
   *
   * @param {*} request a download request in the format; `{ sourceUrl, destPath }`
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
        let activeStream = downloadTask.start();
        downloadStreams.push(activeStream);
        activeDownloadTasks.push(activeStream);
      } else {
        let inactiveStream = downloadTask.wait();
        downloadStreams.push(inactiveStream);
        inactiveDownloadTasks.push(inactiveStream);
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
