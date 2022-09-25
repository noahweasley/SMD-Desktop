/**
 * Mode used in reading and writing data to database.
 */
module.exports.Mode = Object.freeze({
  ALL: "All-download-data",
  MULTIPLE: "Multiple-download-data",
  SINGLE: "One-download-data",
  SELECT: "Some-download-data"
});

/**
 * the type of data that can exists in the database
 */
module.exports.Type = Object.freeze({
  DOWNLOADED: "Downloaded",
  DOWNLOADING: "Downloading",
  JOINED: "Join"
});
