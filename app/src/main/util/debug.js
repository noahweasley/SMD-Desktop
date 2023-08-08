/**
 * @returns a flag indicating if `process.env.WINDOW_DEBUG_ENABLED` environmental variable was set
 */
module.exports.isWindowDebugEnabled = () => {
  const pattern = /^(true)$/i;
  return pattern.test(process.env.WINDOW_DEBUG_ENABLED);
};

/**
 * @returns a flag indicating if `process.env.CAN_SWEEP_EMPTY_FILES` environmental variable was set
 */
module.exports.canSweepEmptyFiles = () => {
  const pattern = /^(true)$/i;
  return pattern.test(process.env.CAN_SWEEP_EMPTY_FILES);
};
