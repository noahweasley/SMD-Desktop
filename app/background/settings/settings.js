"use-strict";

const { app } = require("electron");

const path = require("path");
const fs = require("fs");

const preferenceFileDir = path.join(app.getPath("userData"), "preference");
const preferenceFilePath = path.join(preferenceFileDir, "preference.json");

function getPreferences() {
  try {
    const data = fs.readFileSync(preferenceFilePath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    return createPrefFile();
  }

  function createPrefFile() {
    fs.writeFileSync(preferenceFilePath, "{}", (err) => {
      if (err) console.log("An error occurred while writing file");
    });

    return {};
  }
}

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
module.exports.checkExistingKey = function (key) {
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
  if (this.checkExistingKey(key)) {
    const dataOB = getPreferences();
    // wrap return value with String, to provide hint on what getState returns
    return new String(dataOB[`${key}`]);
  } else return new String(defaultValue);
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
  if (this.checkExistingKey(key)) {
    const dataOB = getPreferences();
    // wrap return value with String, to provide hint on what getState returns
    return new String(dataOB[`${key}`]);
  } else return new String(defaultValue);
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
 * Retrieves the path to the app's preference file
 */
module.exports.getPreferenceFilePath = () => preferenceFilePath;
