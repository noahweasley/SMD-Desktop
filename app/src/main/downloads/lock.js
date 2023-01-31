"use-strict";

/**
 * A locker to track the amount of task that is running
 *
 * @param {number} concurrency the total number of locks to hold
 */
module.exports = function (concurrency) {
  let CONCURRENCY = concurrency || 2;

  /**
   * @returns the maximum lock countZ
   */
  const getMaxLockCount = () => CONCURRENCY;

  /**
   * Acquires a lock and decrement the max number of locks
   *
   * @returns true if a lock was acquired
   */
  const acquireLock = () => (CONCURRENCY && --CONCURRENCY) !== 0;

  /**
   * Releases a lock and increments the max number of locks
   *
   * @returns true if a lock was released
   */
  const releaseLock = () => (++CONCURRENCY <= maxParallelDownloads);

  return { acquireLock, releaseLock, getMaxLockCount };
};
