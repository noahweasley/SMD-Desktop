require("sqlite3");
const { knex } = require("knex");
const path = require("path");
const { app } = require("electron");
const fsp = require("fs/promises");
const { readFile } = require("fs/promises");
const { Type } = require("./constants");
require("dotenv").config();

const DATABASE_VERSION = "1.0.0";
const DATABASE_NAME = "UserDB.sqlite";

const DOWNLOADED_TABLE = "Downloaded";
const DOWNLOADING_TABLE = "Downloading";

// eslint-disable-next-line no-undef
const DB_FILEPATH = !app.isPackaged ? process.env.DB_FILEPATH : path.join(app.getPath("userData"), "User", "Database");
const DB_FILENAME = path.join(DB_FILEPATH, DATABASE_NAME);
const DB_CONFIG_FILE = path.join(DB_FILEPATH, "metadata.json");

// ======================================================================== //
// =                                                                      = //
//                   DATABASE INITIALIZATION CODE                           //
// =                                                                      = //
// ======================================================================== //

// vs file is used to manage database versions
async function createVSFile() {
  // the initial data in the vs file, when the database is created
  const vsObj = { DATABASE_VERSION };
  try {
    await fsp.mkdir(DB_FILEPATH, { recursive: true });
    await fsp.writeFile(DB_CONFIG_FILE, JSON.stringify(vsObj));
    return vsObj.DATABASE_VERSION;
  } catch (err) {
    throw new Error(`Error while creating VS file: ${err.message}`);
  }
}

// Creates the schema used in CRUD operation
async function createDatabaseSchema() {
  await createDBFolder();

  // upgrade database version
  async function upgradeDatabaseVersion() {
    let vsf = await fsp.readFile(DB_CONFIG_FILE, { encoding: "utf-8" });
    // replace with new database version
    vsf["DATABASE_VERSION"] = DATABASE_VERSION;
    await fsp.writeFile(DB_CONFIG_FILE, JSON.stringify(vsf));
    return DATABASE_VERSION;
  }

  // check database version
  async function checkDatabaseVersion() {
    let dbVersion;

    try {
      const data = await readFile(DB_CONFIG_FILE, { encoding: "utf-8" });
      dbVersion = JSON.parse(data)["DATABASE_VERSION"];
    } catch (err) {
      try {
        dbVersion = await createVSFile();
      } catch (err) {
        console.log(err);
        return "1.0.0";
      }
    }

    return dbVersion;
  }

  // create database folder
  async function createDBFolder() {
    // create dir
    async function createDirectory() {
      try {
        await createVSFile();
        return await onCreateDatabase();
      } catch (err) {
        return console.error(err);
      }
    }

    // main code start
    let fileHandle;
    try {
      fileHandle = await fsp.open(DB_FILENAME, "r+");
    } catch (err) {
      if (err.code === "EEXIST") {
        let dbVersion = await checkDatabaseVersion();
        if (dbVersion !== DATABASE_VERSION) {
          // call onUpgradeDatabase() when the database schema needs to be altered or updated
          await upgradeDatabaseVersion();
          return onUpgradeDatabase(dbVersion, DATABASE_VERSION);
        } else {
          return true; // same version was returned
        }
      } else if (err.code === "ENOENT") {
        // create the database directory if file db file doesn't exist.
        await createDirectory();
      } else {
        // unknown bug
        console.error(`An unknown error occurred: ${err.code}: ${err.message}`);
      }
    } finally {
      fileHandle?.close();
    }
  }
}

/**
 * The database object used in CRUD operations
 */
module.exports.database = knex({
  client: "sqlite3",
  version: DATABASE_VERSION,
  useNullAsDefault: true,
  connection: { filename: DB_FILENAME }
});

let __database = this.database;

// - --------------------------------------------------------------------- - //
// -                                                                       - //
// -                       MAIN DATABASE CODE                              - //
// -                                                                       - //
// - --------------------------------------------------------------------- - //

/**
 * Called in database lifecycle when the database is about to be created.
 *  onUpgradeDatabase() would be called instead of this, if the database already exist.
 */
function onCreateDatabase() {
  // Create the schema for the table to persist window properties on start-up
  async function createTables() {
    try {
      await __database.schema.createTable(DOWNLOADED_TABLE, (tableBuilder) => {
        tableBuilder.increments();
        tableBuilder.integer("Track_Download_Size");
        tableBuilder.string("Track_Playlist_Title");
        tableBuilder.string("Track_Title");
        tableBuilder.string("Track_Artists");
        tableBuilder.string("Track_Url");
      });

      await __database.schema.createTable(DOWNLOADING_TABLE, (tableBuilder) => {
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
        tableBuilder.string("Message");
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
      let data = await __database.select("*").from(DOWNLOADED_TABLE);
      return data.length > 0 ? data : null;
    } else if (arg["type"] == Type.DOWNLOADING) {
      let data = await __database.select("*").from(DOWNLOADING_TABLE);
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

    if (arg["type"] == Type.DOWNLOADED) {
      let result = await __database.insert(arg["data"]).into(DOWNLOADED_TABLE).returning("id");
      return result[0]; // the column id
    } else if (arg["type"] == Type.DOWNLOADING) {
      // data property is the main db data in the object
      let result = await __database.insert(arg["data"]).into(DOWNLOADING_TABLE).returning("id");
      return result[0]; // the column id
    } else {
      throw new Error(`${arg["type"]} is not supported`);
    }
  } catch (err) {
    console.error(err);
    return -1;
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

  try {
    // only create database when the data is about to be used
    await createDatabaseSchema();

    if (arg["type"] == Type.DOWNLOADED) {
      let result = await __database.del().where({ id: data["id"] }).from(DOWNLOADED_TABLE);
      return result > 0;
    } else if (arg["type"] == Type.DOWNLOADING) {
      let result = await __database.del().where({ id: data["id"] }).from(DOWNLOADING_TABLE);
      return result > 0;
    } else throw new Error(`${arg["type"]} is not supported`);
  } catch (err) {
    console.error(err.message);
    return false;
  }
};
