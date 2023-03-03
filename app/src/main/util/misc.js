"use-strict";

/**
 * Delays program
 * @param {number} timeout delay period in milliseconds
 * @returns a Promise that resolves after `timeout` milliseconds
 */
module.exports.delay = function (timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
};
