require("sqlite3");
const { knex } = require("knex");
const path = require("path");
const { app } = require("electron");
const fs = require("fs");

const DATABASE_VERSION = "1.0.0";
const DOWNLOADED_TABLE = "Downloaded_Table";
const DOWNLOADING_TABLE = "Downloading_Table";

const dbPath = path.join(app.getPath("userData"), "User", "Database");
const dbFile = path.join(dbPath, "UserDB.db");
const dbConfigFile = path.join(dbPath, "dbConfig.json");

/**
 * Mode used in reading and writing data to database.
 */
module.exports.Mode = Object.freeze({
  ALL: "All-download-data",
  SINGLE: "One-download-data",
  SELECT: "Some-download-data",
});

/**
 * The database object used in CRUD operations
 */
const database = (module.exports.database = knex({
  client: "sqlite",
  version: DATABASE_VERSION,
  useNullAsDefault: true,
  connection: {
    filename: path.join(app.getPath("userData"), "User", "Database", "UserDB.db"),
  },
}));

// Creates the schema used in CRUD operation
function createDatabaseSchema() {
  createDBFolder();

  function createDBFolder() {
    fs.open(dbFile, "wx", (err, _fd) => {
      function createDirectory() {
        fs.mkdir(
          dbPath,
          {
            recursive: true,
          },
          function (err) {
            if (err) console.log("An error occurred while creating db directories");
            else {
              onCreateDatabase();
            }
          }
        );
      }

      if (err) {
        if (err.code === "EEXIST") {
          if (checkDatabaseVersion()) onUpgradeDatabase();
        } else if (err.code === "ENOENT") createDirectory(dbPath);
        else console.log(err.code);
      }
    });
  }

  ///////////////////////////////////////
  function checkDatabaseVersion() {
    fs.openSync(dbConfigFile, "wx", (err, _fd) => {
      if (err) {
        if (err.code === "EEXIST") {
        } else {
          createVSFile();
        }
      }
    });
  }
  ///////////////////////////////////////

  function onCreateDatabase() {
    // Create the schema for the table to persist window properties on start-up
    database.schema
      .hasTable(DOWNLOADING_TABLE)
      .then((exists) => {
        if (!exists) {
          return database.schema.createTable(DOWNLOADING_TABLE, (tableBuilder) => {
            tableBuilder.increments();
          });
        }
      })
      .catch((error) => {
        console.log(`An error occurred while creating schema: ${error.message}`);
      });
  }
}

/**
 *
 */
function onUpgradeDatabase(oldVersion, newVersion) {
  console.log("Database exists, onUpgradeDatabase() called");
}

/**
 * Checks if a particular mode is valid
 *
 * @param {*} mode the mode to be checked
 * @returns return true if mode is valid, fthrows an exception if not
 */
module.exports.checkMode = function (mode) {
  for (let m in this.Mode) {
    if (this.Mode[`${m}`] === mode) {
      return true;
    }
  }
  throw new Error(`${mode} is not supported`);
};

/**
 * @param {*} type the type of download data to be retrieved, if null or empty all the
 * download data would be appended together, with downloading being the first and downloaded being the last
 *
 * @returns the list data as stored in the application's database
 */
module.exports.getDownloadData = function (data, mode) {
  this.checkMode(mode);
  createDatabaseSchema();
  const table = database(DOWNLOADING_TABLE);
  return null;
};

/**
 * Adds download data to app's database
 *
 * @param {*} type the type of data to be added into database
 */
module.exports.addDownloadData = function (data, mode) {
  this.checkMode(mode);
  createDatabaseSchema();
  const table = database(DOWNLOADS_TABLE);
};

/**
 * Deletes download data to app's database
 *
 * @param {*} type the type of data to be added into database
 */
module.exports.deleteDownloadData = function (data, mode) {
  this.checkMode(mode);
  createDatabaseSchema();
  const table = database(DOWNLOADS_TABLE);
};
