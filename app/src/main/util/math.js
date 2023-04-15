/**
 * @param {number} bytes the bytes to be converted
 * @returns a human readable representation of size in bytes
 */
module.exports.getReadableSize = function (bytes) {
  const _1KB = 1024;
  const _1MB = _1KB * 1024;
  const _1GB = _1MB * 1024;
  const _1TB = _1GB * 1024;

  if (bytes >= _1KB && bytes < _1MB) {
    return `${(bytes / _1KB).toFixed(2)} KB`;
  } else if (bytes >= _1MB && bytes < _1GB) {
    return `${(bytes / _1MB).toFixed(2)} MB`;
  } else if (bytes >= _1GB && bytes < _1TB) {
    return `${(bytes / _1GB).toFixed(2)} GB`;
  } else if (bytes >= _1TB) {
    return `${(bytes / _1TB).toFixed(2)} TB`;
  } else {
    return `${bytes} B`;
  }
};
