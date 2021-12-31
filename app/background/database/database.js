require("sqlite3");
const knex = require("knex");
const path = require("path");
const { app } = require("electron");

const database = knex({
  client: "sqlite",
  useNullAsDefault: true,
  connection: {
    filename: path.join(app.getPath("userData"), "User", "Database", "UserDB.sqlite"),
  },
});
