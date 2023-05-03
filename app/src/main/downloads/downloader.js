const downloadTask = require("./download-task");
const Lock = require("./lock");

module.exports = function (config) {
  const { targetWindow, maxParallelDownloads } = config;

  const locker = Lock({ maxLockCount: maxParallelDownloads });

  let downloadTaskQueue = [];
  const activeTasks = [];
  const pendingTasks = [];

  let _activeTaskCount = 0;
  let _inactiveTaskCount = 0;

  /**
   * @returns the number of active downloads
   */
  const activeTaskCount = () => _activeTaskCount;

  /**
   *@returns the number of inactive downloads
   */
  const inactiveTaskCount = () => _inactiveTaskCount;

  /**
   * Clears the task queue
   */
  function clearTaskQueue() {
    downloadTaskQueue = [];
  }

  /**
   * Enqueue a download task
   *
   * @param {JSON} request a download request object
   */
  function enqueueTask(task, request = {}) {
    const task0 = downloadTask({ task, targetWindow, request });
    downloadTaskQueue.push(task0);
    return task;
  }

  /**
   * Enqueue a download task
   *
   * @param {array} request  a download request object
   * @param {array} insertedColumnIds an array of objects with task id as keys
   */
  function enqueueTasks(taskOptions) {
    const insertedColumnIds = taskOptions.searchResultIds;
    const requests = taskOptions.searchResults;

    for (let x = 0; x < requests.length; x++) {
      enqueueTask(insertedColumnIds[x], requests[x]);
    }
  }

  /**
   * Pause all active downloads
   */
  function pauseAll() {
    // downloadTaskQueue.forEach((task) => task.pause());
  }

  /**
   * Resumes all downloads. If the number of active downloads are more than the max parallel download count,
   * automatically waits till a lock is released
   */
  function resumeAll() {
    // downloadTaskQueue.forEach((downloadTask) => {
    //   if (locker.acquireLock()) {
    //     const downloadStream1 = downloadTask.resume();
    //   } else {
    //     const pendingDownload = downloadTask.wait();
    //   }
    // });
  }

  /**
   * Cancels all active downloads
   */
  async function cancelAll() {
    // downloadTaskQueue.forEach((task) => {
    //   if (locker.releaseLock()) {
    //     task.unshift();
    //     const stream = activeTasks.unshift();
    //     stream.cancel();
    //   }
    // });
  }

  /**
   * Puts all the download tasks in their active state. If maxParallelDownloads is higher that the
   * number of download task on the download queue, then the remaining tasks enter their pending states
   */
  async function initiateQueuedDownloads() {
    const downloadPipePromises = [];

    await Promise.all(
      downloadTaskQueue.map(async (downloadTask) => {
        if (locker.acquireLock()) {
          const downloadParams = await downloadTask.start();
          const activeDownloadStream = downloadParams.downloadStream;
          const downloadPipePromise = downloadParams.downloadPipePromise;

          activeTasks.push(activeDownloadStream);
          downloadPipePromises.push(downloadPipePromise);
          _activeTaskCount++;
        } else {
          const pendingDownload = downloadTask.wait();
          pendingTasks.push(pendingDownload);
          _inactiveTaskCount++;
        }
      })
    );

    try {
      // eslint-disable-next-line no-unused-vars
      const results = await Promise.all(downloadPipePromises);
    } catch (error) {
      // ignore all errors for now
    }

    clearTaskQueue();
    // return downloadStreams;
  }

  return {
    initiateQueuedDownloads,
    clearTaskQueue,
    enqueueTask,
    enqueueTasks,
    pauseAll,
    resumeAll,
    cancelAll,
    activeTaskCount,
    inactiveTaskCount
  };
};
