 'use-strict'

 const {
     app
 } = require('electron')

 const path = require('path')
 const fs = require('fs')
 
 const preferenceFilePath = path.join(app.getPath('userData'), 'preference', 'preference.json')

 function getPreferences() {
     try {
         const data = fs.readFileSync(preferenceFilePath, 'utf8')
         return JSON.parse(data)
     } catch (err) {
         console.error('An error occurred while reading file')
         return {}
     }
 }

 function setPreferences(pref) {
     try {
         fs.writeFileSync(preferenceFilePath, pref)
     } catch (err) {
         console.error('An error occurred while writing file')
         return {}
     }
 }

 /**
  * Checks if the key specified by *key* is present in app preference
  * @param key the key to check it's existence
  */
 module.exports.checkExistingKey = function (key) {
     if (!key instanceof String) throw new Error(key + " has to be a string")
     // check if object has property key
     for (let pref in getPreferences()) {
         if (pref === key) return true
     }

     return false
 }

 /**
  * Retrieves the state of a user preference using a key-value pair
  * 
  * @param {*} key the key in settings in which it's value would be retrieved 
  * @param {*} defaultValue the default value to be retrieved if that key has never been set
  */
 module.exports.getState = function (key, defaultValue) {
     if (!key instanceof String) throw new Error(key + " has to be a string")

     if (this.checkExistingKey(key)) {
         const dataOB = getPreferences()
         return dataOB[`${key}`]
     } else return defaultValue
 }

 /**
  * Sets the state of a user preference using a key-value pair
  * Note: A new key would be created after this request
  * 
  * @param {*} key the key in settings in which it's value would be retrieved 
  * @param {*} value the value to be set
  */
 module.exports.setState = function (key, value) {
     let pref = getPreferences()
     pref[`${key}`] = `${value}`
     setPreferences(JSON.stringify(pref))
 }

 /**
  * Retrieves the path to the app's preference file
  */
 module.exports.getPreferenceFilePath = () => preferenceFilePath