require("sqlite3");
const { knex } = require("knex");
const path = require("path");
const { app } = require("electron");

const DOWNLOADS_TABLE = "Downloads_Table";

/**
 * The database object used in CRUD operations
 */
module.exports.database = knex({
  client: "sqlite",
  version: "1.0.0",
  useNullAsDefault: true,
  connection: {
    filename: path.join(app.getPath("userData"), "User", "Database", "UserDB.db"),
  },
});

/**
 * @param {*} type the type of download data to be retrieved, if null or empty all the
 * download data would be appended together, with downloading being the first and downloaded being the last
 *
 * @returns the list data as stored in the application's database
 */
module.exports.getDownloadData = function (type) {
  const table = this.database(DOWNLOADS_TABLE);
  return null;
};

/**
 * Adds download data to app's database
 *
 * @param {*} type the type of data to be added into database
 */
module.exports.addDownloadData = function (type) {
  const table = this.database(DOWNLOADS_TABLE);
};
