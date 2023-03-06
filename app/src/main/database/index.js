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
const DB_FILEPATH = process.env.DB_FILEPATH || path.join(app.getPath("userData"), "User", "Database");
const DB_FILENAME = path.join(DB_FILEPATH, DATABASE_NAME);
const DB_CONFIG_FILE = path.join(DB_FILEPATH, "metadata.json");

// ======================================================================== //
// =                                                                      = //
//                   DATABASE INITIALIZATION CODE                           //
// =                                                                      = //
// ======================================================================== //

async function createVSFile() {
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
    const vsf = await fsp.readFile(DB_CONFIG_FILE, { encoding: "utf-8" });
    // replace with new database version
    vsf.DATABASE_VERSION = DATABASE_VERSION;
    await fsp.writeFile(DB_CONFIG_FILE, JSON.stringify(vsf));
    return DATABASE_VERSION;
  }

  // check database version
  async function checkDatabaseVersion() {
    let dbVersion;

    try {
      const data = await readFile(DB_CONFIG_FILE, { encoding: "utf-8" });
      dbVersion = JSON.parse(data).DATABASE_VERSION;
    } catch (err) {
      try {
        dbVersion = await createVSFile();
      } catch (error) {
        console.error(error);
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
      } catch (error) {
        return console.error(error);
      }
    }

    // main code start
    let fileHandle;
    try {
      fileHandle = await fsp.open(DB_FILENAME, "r+");
    } catch (error) {
      if (error.code === "EEXIST") {
        const dbVersion = await checkDatabaseVersion();
        if (dbVersion !== DATABASE_VERSION) {
          // call onUpgradeDatabase() when the database schema needs to be altered or updated
          await upgradeDatabaseVersion();
          return onUpgradeDatabase(dbVersion, DATABASE_VERSION);
        } else {
          return true; // same version was returned
        }
      } else if (error.code === "ENOENT") {
        // create the database directory if file db file doesn't exist.
        await createDirectory();
      } else {
        // unknown bug
        console.error("An unknown error occurred", error.message);
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

const __database = this.database;

// - --------------------------------------------------------------------- - //
// -                                                                       - //
// -                       MAIN DATABASE CODE                              - //
// -                                                                       - //
// - --------------------------------------------------------------------- - //

async function getRWDatabase() {
  await createDatabaseSchema();
  return __database;
}

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
        tableBuilder.integer("TrackDownloadSize");
        tableBuilder.string("TrackPlaylistTitle");
        tableBuilder.string("TrackTitle");
        tableBuilder.string("TrackArtists");
        tableBuilder.string("TrackUri");
      });

      await __database.schema.createTable(DOWNLOADING_TABLE, (tableBuilder) => {
        tableBuilder.string("id").primary();
        tableBuilder.boolean("ErrorOccurred");
        tableBuilder.string("DownloadState");
        tableBuilder.string("TrackPlaylistTitle");
        tableBuilder.string("TrackTitle");
        tableBuilder.string("TrackArtists");
        tableBuilder.integer("DownloadedSize");
        tableBuilder.integer("TrackDownloadSize");
        tableBuilder.integer("DownloadProgress");
        tableBuilder.string("TrackUrl");
        tableBuilder.string("Message");
      });
      return true;
    } catch (error) {
      console.error(error);
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
 * @param arg an object in format {query: {}}, as an additional query parameter
 * @returns the list data as stored in the application's database
 */
module.exports.getDownloadData = async function (arg) {
  const database = await getRWDatabase();

  try {
    if (arg.type == Type.DOWNLOADED) {
      const data = await database.select("*").from(DOWNLOADED_TABLE);
      return data.length > 0 ? data : null;
    } else if (arg.type == Type.DOWNLOADING) {
      const data = await database.select("*").from(DOWNLOADING_TABLE);
      return data.length > 0 ? data : null;
    } else {
      throw new Error(`${arg.type} is not supported`);
    }
  } catch (error) {
    console.error(error);
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
  const database = await getRWDatabase();

  try {
    if (arg.type == Type.DOWNLOADED) {
      const result = await database.insert(arg.data).into(DOWNLOADED_TABLE).returning("id");
      return result; // the column ids
    } else if (arg.type == Type.DOWNLOADING) {
      // data property is the main db data in the object
      const result = await database.insert(arg.data).into(DOWNLOADING_TABLE).returning("id");
      return result; // the column ids
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
    if (arg.type == Type.DOWNLOADED) {
      throw new Error("Update is not yet supported");
    } else if (arg.type == Type.DOWNLOADING) {
      throw new Error("Update is not yet supported");
    } else {
      throw new Error(`${arg.type} is not supported`);
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
  const database = await getRWDatabase();

  try {
    if (arg.type == Type.DOWNLOADED) {
      const result = await database.del().where({ id: arg.data.id }).from(DOWNLOADED_TABLE);
      return result > 0;
    } else if (arg.type == Type.DOWNLOADING) {
      const result = await database.del().where({ id: arg.data.id }).from(DOWNLOADING_TABLE);
      return result > 0;
    } else throw new Error(`${arg.type} is not supported`);
  } catch (error) {
    console.error(error);
    return false;
  }
};
