// require("sqlite3");
// const knex = require("knex");
// const path = require("path");
// const { app } = require("electron");

// /**
//  * 
//  */
// module.exports.database = knex({
//   client: "sqlite",
//   useNullAsDefault: true,
//   connection: {
//     filename: path.join(app.getPath("userData"), "User", "Database", "UserDB.sqlite"),
//   },
// });

/**
 * @returns the list data as stored in the application's database
 */
module.exports.getDownloadData = function () {
  return null;
};
