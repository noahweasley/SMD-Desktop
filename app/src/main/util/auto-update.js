const { app } = require("electron");
const superagent = require("superagent");
const { setTimeout } = require("timers/promises");

/**
 * @returns The latest release info
 */
async function getLatestRelease() {
  return new Promise((resolve, reject) => {
    const url = "https://api.github.com/repos/noahweasley/SMD-Desktop/releases/latest";
    superagent
      .get(url)
      .set("User-Agent", "Superagent")
      .type("json")
      .accept("json")
      .end((err, res) => {
        if (err) {
          reject(err);
        } else {
          if (res.status === 200) {
            resolve(JSON.parse(res.text));
          } else {
            reject(new Error("Failed to fetch data. Status code:", res.status));
          }
        }
      });
  });
}

/**
 * Check for updates
 */
module.exports.checkForUpdates = async function () {
  try {
    const latestRelease = await getLatestRelease();
    await setTimeout(3000);
    const currentVersion = `v${app.getVersion()}`;
    if (currentVersion !== latestRelease.tag_name) {
      return latestRelease;
    } else {
      return Promise.resolve(null);
    }
  } catch (err) {
    return Promise.resolve(null);
  }
};
