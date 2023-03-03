"use-strict";

/**
 * @param {number} bytes the bytes to be converted
 * @returns a human readable representation of file size
 */
module.exports.getReadableSize = function (bytes) {
  const _1KB = 1024;
  const _1MB = _1KB * 1024;
  const _1GB = _1MB * 1024;
  const _1TB = _1GB * 1024;

  if (bytes >= _1KB && bytes < _1MB) {
    return `${Math.round(bytes / _1KB)} KB`;
  } else if (bytes >= _1MB && bytes < _1GB) {
    return `${Math.round(bytes / _1MB)} MB`;
  } else if (bytes >= _1GB && bytes < _1TB) {
    return `${Math.round(bytes / _1GB)} GB`;
  } else if (bytes >= _1TB) {
    return `${Math.round(bytes / _1TB)} TB`;
  } else {
    return `${bytes} bytes`;
  }
};
