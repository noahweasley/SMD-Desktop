/**
 * @returns a flag indicating if `process.env.WINDOW_DEBUG_ENABLED` environmental variable was set
 */
module.exports.isWindowDebugEnabled = () => {
  const pattern = /^(true)$/i;
  return pattern.test(process.env.WINDOW_DEBUG_ENABLED);
};
