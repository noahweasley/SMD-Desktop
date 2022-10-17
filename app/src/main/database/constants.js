"use-strict";

/**
 * the type of data that can exists in the database
 */
module.exports.Type = Object.freeze({
  DOWNLOADED: "Downloaded",
  DOWNLOADING: "Downloading",
  JOINED: "Join"
});

/**
 * Possible states of a download task
 */
module.exports.States = Object.freeze({
  PENDING: "Pending",
  ACTIVE: "Active",
  PAUSED: "Paused",
  COMPLETED: "Completed",
  FAILED: "Failed"
});
