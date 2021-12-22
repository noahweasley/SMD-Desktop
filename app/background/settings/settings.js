"use-strict";

const { app } = require("electron");

const path = require("path");
const fs = require("fs");

const preferenceFileDir = path.join(app.getPath("userData"), "preference");
const preferenceFilePath = path.join(preferenceFileDir, "preference.json");

// read the preference file from disk and then return an object representation
// of the file
function getPreferences() {
  try {
    const data = fs.readFileSync(preferenceFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return createPrefFile();
  }

  function createPrefFile() {
    fs.open(preferenceFilePath, "wx", (err, _fd) => {
      function createPrefDirectory() {
        fs.mkdir(
          prefDir,
          {
            recursive: true,
          },
          function (err) {
            if (err) console.log("An error occurred while creating directory");
          }
        );
      }

      if (err) {
        if (err.code === "EEXIST") return;
        else if (err.code === "ENOENT") createPrefDirectory();
        else console.log(err.code);
      } else {
        fs.writeFileSync(preferenceFilePath, "{}", (err) => {
          if (err) console.log("An error occurred while writing file");
        });
      }
    });

    return {};
  }
}

// writes to file, the specific pref specified by *pref*
function setPreferences(pref) {
  const preference = JSON.stringify(pref);
  try {
    fs.writeFileSync(preferenceFilePath, preference);
    return true;
  } catch (err) {
    console.error("An error occurred while writing file");
    return false;
  }
}

/**
 * Checks if the key specified by *key* is present in app preference
 
 * @param key the key to check it's existence
 */
module.exports.hasKey = function (key) {
  if (!key instanceof String) throw new Error(key + " has to be a string");
  // check if object has property key
  for (let pref in getPreferences()) {
    if (pref === key) return true;
  }

  return false;
};

/**
 * Retrieves the state of a user preference using a key-value pair
 *
 * @param {*} key the key in settings in which it's value would be retrieved
 * @param {*} defaultValue the default value to be retrieved if that key has never been set
 */
module.exports.getState = function (key, defaultValue) {
  if (!key instanceof String) throw new Error(key + " has to be a string");
  // first check if key exists
  if (this.hasKey(key)) {
    const dataOB = getPreferences();
    // wrap return value with String, to provide hint on what getState returns
    return `${dataOB[`${key}`]}`;
  } else return `${defaultValue}`;
};

/**
 * Sets the state of a user preference using a key-value pair
 * Note: A new key would be created after this request
 *
 * @param {*} key the key in settings in which it's value would be retrieved
 * @param {*} value the value to be set
 */
module.exports.setState = function (key, value) {
  let pref = getPreferences();
  pref[`${key}`] = `${value}`;
  return setPreferences(pref);
};

/**
 * Removes a preference value from settings if it exists
 * Note: Trying to use *getState()* would just return the default arg set
 
 * @param {*} key the key in settings that would be deleted
 */
module.exports.deleteKey = function (key) {
  let pref = getPreferences();
  // check if key is present in prefs
  if (this.hasKey(key)) {
    delete pref[`${key}`];
  } else {
    // nothing was deleted, but still return true
    return true;
  }

  return setPreferences(pref);
};

/**
 * Retrieves the path to the app's preference file
 */
module.exports.getPreferenceFilePath = () => preferenceFilePath;