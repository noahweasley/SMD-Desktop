const { app } = require("electron");
const { getDownloadsDir } = require("./files");

/**
 * Sweep empty downloaded tracks in debug mode
 */
module.exports.sweepEmptyFiles = async (verbose = true) => {
  if (!app.isPackaged && this.canSweepEmptyFiles()) {
    try {
      await require("clean-sweep").promises.sweep(getDownloadsDir(), { verbose });
    } catch (ignored) {
      /* empty */
    }
  }
};

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
