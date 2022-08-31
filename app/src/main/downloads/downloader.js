"use-strict";

const ytdl = require("../server/youtube-dl");
const downloadTask = require("./download-task");

module.exports = function (config) {
  const { maxParallelDownloads } = config;

  let downloadQueue = [],
    activeDownloadTasks = [];

  async function enqueueTask(request = {}) {
    let task = downloadTask(request);
    downloadQueue.push(task);
    return task;
  }

  async function enqueueTasks(requests = []) {
    // return requests.map((request) => enqueue(request));
    requests.forEach((request) => {
      downloadQueue.push(enqueueTask(request));
    });

    return downloadQueue;
  }

  async function initiateDownloads() {}

  async function pauseAll() {
    downloadQueue.forEach((task) => task.pause());
  }

  async function resumeAll() {
    downloadQueue.forEach((task) => task.resume());
  }

  async function cancelAll() {
    downloadQueue.forEach((task) => task.cancel());
  }

  const activeTasks = () => activeDownloadTasks;

  return {
    downloadQueue,
    initiateDownloads,
    enqueueTask,
    enqueueTasks,
    pauseAll,
    resumeAll,
    cancelAll,
    activeTasks
  };
};
