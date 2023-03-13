"use-strict";

/**
 * Error in arguments
 */
class IllegalArgumentError extends Error {
  /**
   * @param {string} message the error message
   */
  constructor(message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error in state
 */
class IllegalStateError extends Error {
  /**
   * @param {string} message the error message
   */
  constructor(message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { IllegalStateError, IllegalArgumentError };
