require("better-sqlite3");
const { knex } = require("knex");
const path = require("path");
const { app } = require("electron");
const fs = require("fs");
const { readFile } = require("fs/promises");
const { Type } = require("./constants");

const DATABASE_VERSION = "1.0.0";
const DATABASE_NAME = "UserDB.db";
const DOWNLOADED_TABLE = "Downloaded_Table";
const DOWNLOADING_TABLE = "Downloading_Table";

const DB_FILEPATH = path.join(app.getPath("userData"), "User", "Database");
const DB_FILENAME = path.join(DB_FILEPATH, DATABASE_NAME);
const DB_CONFIG_FILE = path.join(DB_FILEPATH, "metadata.json");

/**
 * The database object used in CRUD operations
 */
const database = (module.exports.database = knex({
  client: "better-sqlite3",
  version: DATABASE_VERSION,
  useNullAsDefault: true,
  connection: { filename: DB_FILENAME }
}));

// vs file is used to manage database versions
function createVSFile() {
  return new Promise((resolve, reject) => {
    // the initial data in the vs file, when the database is created
    const vsObj = { DATABASE_VERSION: "1.0.0" };
    // write vs to file
    fs.writeFile(DB_CONFIG_FILE, JSON.stringify(vsObj), function (err) {
      if (err) reject(new Error(`Error while creating VS file: ${err.message}`));
      else resolve(vsObj.DATABASE_VERSION);
    });
  });
}

// Creates the schema used in CRUD operation
function createDatabaseSchema() {
  return new Promise((resolve, reject) => {
    createDBFolder();

    function createDBFolder() {
      fs.open(DB_FILENAME, "wx", async (err, _fd) => {
        function createDirectory() {
          fs.mkdir(DB_FILEPATH, { recursive: true }, async function (err) {
            if (err) {
              reject(new Error(`An error occurred while creating db directories: ${err.message}`));
            } else {
              // if database folder was created successfully, then create the db and vs file and
              // start populating it with tables
              try {
                await createVSFile();
              } catch (err1) {
                console.err(err1);
              }

              try {
                resolve(await onCreateDatabase());
              } catch (err) {
                reject(err);
              }
            }
          });
        }

        if (err) {
          if (err.code === "EEXIST") {
            let dbVersion = await checkDatabaseVersion();
            if (dbVersion !== DATABASE_VERSION) {
              // call onUpgradeDatabase() when the database schema needs to be altered or updated
              await upgradeDatabaseVersion();
              resolve(onUpgradeDatabase(dbVersion, DATABASE_VERSION));
            } else {
              resolve(true);
            }
          } else if (err.code === "ENOENT") {
            // create the database directory if file db file doesn't exist.
            createDirectory();
          } else {
            // unknown bug
            console.error(`An unknown error occurred: ${err.code}: ${err.message}`);
          }
        }
      });
    }

    function upgradeDatabaseVersion() {
      return new Promise((resolve, reject) => {
        // read the current database version
        fs.readFile(DB_CONFIG_FILE, function (err, vsf) {
          if (err) {
            // vs file corrupt! This would probably be caused by user action
            reject(err);
          } else {
            let vs_obj = JSON.parse(vsf.toString());
            // replace with new database version
            vs_obj["DATABASE_VERSION"] = DATABASE_VERSION;
            fs.writeFile(DB_CONFIG_FILE, JSON.stringify(vs_obj), function (err) {
              err ? reject(err) : resolve(DATABASE_VERSION);
            });
          }
        });
      });
    }

    async function checkDatabaseVersion() {
      let dbVersion;
      let data;

      try {
        data = await readFile(DB_CONFIG_FILE, { encoding: "utf-8" });
        dbVersion = JSON.parse(data)["DATABASE_VERSION"];
      } catch (err) {
        try {
          dbVersion = await createVSFile();
        } catch (err) {
          console.log(err);
        }
      }

      return dbVersion;
    }
  });

  // promise end
}

// ---------------------------------------------------------------------------------------

/**
 * Called in database lifecycle when the database is about to be created.
 *  onUpgradeDatabase() would be called instead of this, if the database already exist.
 */
function onCreateDatabase() {
  // Create the schema for the table to persist window properties on start-up
  async function createTables() {
    try {
      await database.schema.createTable(DOWNLOADED_TABLE, (tableBuilder) => {
        tableBuilder.increments();
        tableBuilder.integer("Track_Download_Size");
        tableBuilder.string("Track_Playlist_Title");
        tableBuilder.string("Track_Title");
        tableBuilder.string("Track_Artists");
        tableBuilder.string("Track_Url");
      });

      await database.schema.createTable(DOWNLOADING_TABLE, (tableBuilder) => {
        tableBuilder.increments();
        tableBuilder.boolean("Error_Occurred");
        tableBuilder.string("Download_State");
        tableBuilder.string("Track_Playlist_Title");
        tableBuilder.string("Track_Title");
        tableBuilder.string("Track_Artists");
        tableBuilder.integer("Downloaded_Size");
        tableBuilder.integer("Track_Download_Size");
        tableBuilder.integer("Download_Progress");
        tableBuilder.string("Track_Url");
      });
      return true;
    } catch (err) {
      console.error(err.message);
      return false;
    }
  }

  return createTables();
}

/**
 * This callback would be called when the database version has changed.
 * You should alter tables in this function
 *
 * @param oldVersion the old version code of the database
 * @param newVersion the new version code of the database
 */
function onUpgradeDatabase(oldVersion, newVersion) {
  console.info(`onUpgradeDatabase() called with; old version: {${oldVersion}, new version: ${newVersion}}`);

  return true;
}

/**
 * @param {*} type the type of download data to be retrieved, if null or empty all the
 * download data would be appended together, with downloading being the first and downloaded being the last
 *
 * @param arg an object in format {query: {}}, as an additional query parameter
 * @param mode the mode used in fetching the data from database
 * @returns the list data as stored in the application's database
 */
module.exports.getDownloadData = async function (arg) {
  // only create database when the data is about to be used
  try {
    await createDatabaseSchema();

    if (arg["type"] == Type.DOWNLOADED) {
      let data = await database.select("*").from(DOWNLOADED_TABLE);
      return data.length > 0 ? data : null;
    } else if (arg["type"] == Type.DOWNLOADING) {
      let data = await database.select("*").from(DOWNLOADING_TABLE);
      return data.length > 0 ? data : null;
    } else {
      throw new Error(`${arg["type"]} is not supported`);
    }
  } catch (err) {
    console.log(err.message);
    return [];
  }
};

/**
 * Adds download data to app's database
 *
 * @param mode the mode used in fetching the data from database
 * @param arg an object in format {type, data}, as an additional query parameter
 * @returns true if the data was added
 */
module.exports.addDownloadData = async function (arg) {
  try {
    // only create database when the data is about to be used
    await createDatabaseSchema();

    return console.log(arg["data"]);

    if (arg["type"] == Type.DOWNLOADED) {
      let result = await database.insert(arg["data"]).into(DOWNLOADED_TABLE);
      // the value at result[0] would return the number of data inserted
      if (result[0]) return true;
    } else if (arg["type"] == Type.DOWNLOADING) {
      // data property is the main db data in the object
      let result = await database.insert(arg["data"]).into(DOWNLOADING_TABLE);
      // the value at result[0] would return the number os data inserted
      if (result[0]) return true;
    } else {
      throw new Error(`${arg["type"]} is not supported`);
    }

    return false;
  } catch (err) {
    console.error(err);
    return false;
  }
};

/**
 * Updates download data in app's database
 *
 * @param arg an object in format {query: {}}, as an additional query parameter
 * @param mode the mode used in fetching the data from database
 * @returns true if the data was updated
 */
module.exports.updateDownloadData = async function (arg) {
  try {
    // only create database when the data is about to be used
    await createDatabaseSchema();

    if (arg["type"] == Type.DOWNLOADED) {
      throw new Error("Update is not yet supported");
    } else if (arg["type"] == Type.DOWNLOADING) {
      throw new Error("Update is not yet supported");
    } else {
      throw new Error(`${arg["type"]} is not supported`);
    }
  } catch (err) {
    console.log(err.message);
  }
};

/**
 * Deletes download data in app's database
 *
 * @param arg an object in format {query: {}}, as an additional query parameter
 */
module.exports.deleteDownloadData = async function (arg) {
  let data = arg["data"];
  this.checkMode(mode);
  try {
    // only create database when the data is about to be used
    await createDatabaseSchema();

    if (arg["type"] == Type.DOWNLOADED) {
      let result = await database.del().where({ id: data["id"] }).from(DOWNLOADED_TABLE);
      return result > 0;
    } else if (arg["type"] == Type.DOWNLOADING) {
      let result = await database.del().where({ id: data["id"] }).from(DOWNLOADING_TABLE);
      return result > 0;
    } else throw new Error(`${arg["type"]} is not supported`);
  } catch (err) {
    console.error(err.message);
    return false;
  }
};
