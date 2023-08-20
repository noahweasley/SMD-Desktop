/**
 * A locker to track the amount of task that is running
 *
 * @param {number} maxLockCount the total number of locks to hold
 */
module.exports = function (config) {
  const maxLockCount = config.maxLockCount;
  let concurrency = maxLockCount || 2;

  /**
   * @returns {number} the maximum lock count
   */
  const getMaxLockCount = () => maxLockCount;

  /**
   * @returns {number} the remaining number of locks that can be acquired
   */
  const getRemainingNumberOfLocks = () => concurrency;

  /**
   * Acquires a lock and decrement the max number of locks. Decrements never decrement below 0
   *
   * @returns true if a lock was acquired
   */
  const acquireLock = () => (concurrency && --concurrency) !== 0;

  /**
   * Releases a lock and increments the max number of locks. Increments never exceed the max number of locks
   *
   * @returns true if a lock was released
   */
  const releaseLock = () => concurrency < maxLockCount && ++concurrency <= maxLockCount;

  return { acquireLock, releaseLock, getMaxLockCount, getRemainingNumberOfLocks };
};
