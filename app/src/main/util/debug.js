/**
 * @returns a flag indicating if `process.env.WINDOW_DEBUG_ENABLED` environmental variable was set
 */
module.exports.isWindowDebugEnabled = () => Boolean(process.env.WINDOW_DEBUG_ENABLED);
