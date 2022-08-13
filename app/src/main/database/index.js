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
  SELECT: "Some-download-data"
});

/**
 *
 */
module.exports.Type = Object.freeze({
  DOWNLOADED: "Downloaded",
  DOWNLOADING: "Downloading",
  JOINED: "Join"
});

// ----------------------------------------------------------------------------------

/**
 * The database object used in CRUD operations
 */
const database = (module.exports.database = knex({
  client: "sqlite",
  version: DATABASE_VERSION,
  useNullAsDefault: true,
  connection: {
    filename: path.join(app.getPath("userData"), "User", "Database", "UserDB.db")
  }
}));

// vs file is used to manage dabase versions
function createVSFile() {
  // the initial data in the vs file, when the database is created
  const vsObj = {
    DATABASE_VERSION: "1.0.0"
  };
  fs.writeFile(dbConfigFile, JSON.stringify(vsObj), function (err) {
    if (err) console.log(`Error while creating VS file: ${err.message}`);
  });
  return "1.0.0";
}

// Creates the schema used in CRUD operation
function createDatabaseSchema() {
  return new Promise((resolve, reject) => {
    createDBFolder();

    function createDBFolder() {
      fs.open(dbFile, "wx", async (err, _fd) => {
        function createDirectory() {
          fs.mkdir(
            dbPath,
            {
              recursive: true
            },
            function (err) {
              if (err) reject(`An error occurred while creating db directories: ${err.message}`);
              else {
                // if database folder was created successfully, then create the db and vs file and
                // start populating it with tables
                createVSFile();
                resolve(onCreateDatabase());
              }
            }
          );
        }

        if (err) {
          if (err.code === "EEXIST") {
            let dbVersion = checkDatabaseVersion();
            if (dbVersion !== DATABASE_VERSION) {
              // call onUpgradeDatabase() when the database schema needs to be altered or updated
              await upgradeDatabaseVersion();
              resolve(onUpgradeDatabase(dbVersion, DATABASE_VERSION));
            } else {
              resolve(true);
            }
          } else if (err.code === "ENOENT") createDirectory();
          else console.log(err.code);
        }
      });
    }

    function upgradeDatabaseVersion() {
      return new Promise((resolve, reject) => {
        // read the curent database version
        fs.readFile(dbConfigFile, function (err, vsf) {
          if (err) {
            // vs file corrupt! This would probably be caused by user action
            reject(err.message);
          } else {
            let vsObj = JSON.parse(vsf.toString());
            // replace with new database version
            vsObj["DATABASE_VERSION"] = DATABASE_VERSION;
            fs.writeFile(dbConfigFile, JSON.stringify(vsObj), function (err) {
              if (err) reject(err.message);
              else {
                resolve(DATABASE_VERSION);
              }
            });
          }
        });
      });
    }

    function checkDatabaseVersion() {
      let dbVersion;
      let data;

      try {
        data = fs.readFileSync(dbConfigFile, "utf-8");
        dbVersion = JSON.parse(data)["DATABASE_VERSION"];
      } catch (error) {
        dbVersion = createVSFile();
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
      });

      await database.schema.createTable(DOWNLOADING_TABLE, (tableBuilder) => {
        tableBuilder.increments();
        tableBuilder.boolean("Error_Occured");
        tableBuilder.string("Download_State");
        tableBuilder.string("Track_Playlist_Title");
        tableBuilder.string("Track_Title");
        tableBuilder.string("Track_Artists");
        tableBuilder.integer("Downloaded_Size");
        tableBuilder.integer("Track_Download_Size");
        tableBuilder.string("Download_Progress");
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  return createTables();
}

/**
 * This callback would be called when the database version has changed.
 * You should alter tables in this function
 *
 * @param oldversion the old version code of the database
 * @param newVersion the new version code of the database
 */
function onUpgradeDatabase(oldVersion, newVersion) {
  console.log(`onUpgradeDatabase() called with: {${oldVersion}, ${newVersion}}`);

  return true;
}

/**
 * Checks if a particular mode is valid
 *
 * @param mode the mode to be checked
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
 * @param arg an object in format {query: {}}, as an additional query parameter
 * @param mode the mode used in fetching the data from database
 * @returns the list data as stored in the application's database
 */
module.exports.getDownloadData = async function (arg, mode) {
  this.checkMode(mode);
  // only create database when the data is about to be used
  await createDatabaseSchema();

  if (arg["type"] == this.Type.DOWNLOADED) {
    if (mode == this.Mode.ALL) {
      let data = await database.select("*").from(DOWNLOADED_TABLE);
      return data.length > 0 ? data : null;
    }
  } else if (arg["type"] == this.Type.DOWNLOADING) {
    if (mode == this.Mode.ALL) {
      let data = await database.select("*").from(DOWNLOADING_TABLE);
      return data.length > 0 ? data : null;
    }
  } else throw new Error(`${arg["type"]} is not supported`);
};

/**
 * Adds download data to app's database
 *
 * @param mode the mode used in fetching the data from database
 * @param arg an object in format {query: {}}, as an additional query parameter
 * @returns true if the data was added
 */
module.exports.addDownloadData = async function (arg, mode) {
  this.checkMode(mode);
  // only create database when the data is about to be used
  await createDatabaseSchema();

  if (arg["type"] == this.Type.DOWNLOADED) {
    if (mode == this.Mode.ALL) {
      let result = await database.insert(arg["data"]).into(DOWNLOADED_TABLE);
      // the value at result[0] would return the number os data inserted
      console.log(result);
      if (result[0]) return true;
    }
  } else if (arg["type"] == this.Type.DOWNLOADING) {
    if (mode == this.Mode.ALL) {
      let result = await database.insert(arg["data"]).into(DOWNLOADING_TABLE);
      // the value at result[0] would return the number os data inserted
      if (result[0]) return true;
    }
  } else throw new Error(`${arg["type"]} is not supported`);

  return false;
};

/**
 * Updates downlod data in app's database
 *
 * @param arg an object in format {query: {}}, as an additional query parameter
 * @param mode the mode used in fetching the data from database
 * @returns true if the data was updated
 */
module.exports.updateDownloadData = async function (arg, mode) {
  this.checkMode(mode);
  // only create database when the data is about to be used
  await createDatabaseSchema();

  if (arg["type"] == this.Type.DOWNLOADED) {
    if (mode == this.Mode.ALL) {
      throw new Error("Update is not yet supported");
    }
  } else if (arg["type"] == this.Type.DOWNLOADING) {
    if (mode == this.Mode.ALL) {
      throw new Error("Update is not yet supported");
    }
  } else throw new Error(`${arg["type"]} is not supported`);

  return true;
};

/**
 * Deletes download data in app's database
 *
 * @param arg an object in format {query: {}}, as an additional query parameter
 * @param mode the mode used in fetching the data from database
 */
module.exports.deleteDownloadData = async function (arg, mode) {
  let data = arg["data"];
  this.checkMode(mode);
  // only create database when the data is about to be used
  await createDatabaseSchema();

  if (arg["type"] == this.Type.DOWNLOADED) {
    if (mode == this.Mode.ALL) {
    } else if (mode == this.Mode.SINGLE) {
      let result = await database.del().where({ id: data["id"] }).from(DOWNLOADED_TABLE);
      return result > 0;
    }
  } else if (arg["type"] == this.Type.DOWNLOADING) {
    if (mode == this.Mode.ALL) {
    } else if (mode == this.Mode.SINGLE) {
      let result = await database.del().where({ id: data["id"] }).from(DOWNLOADING_TABLE);
      return result > 0;
    }
  } else throw new Error(`${arg["type"]} is not supported`);
  return true;
};
