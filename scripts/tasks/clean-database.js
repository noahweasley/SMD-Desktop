/* eslint-disable no-console */
const { rm } = require("fs");
const chalk = require("chalk");
const { statSync } = require("fs");
require("dotenv").config();

const info0 = chalk.blue;
const error0 = chalk.bold.red;
const success0 = chalk.green;

console.log(info0("Cleaning debug database..."));

let isDirectory;

try {
  isDirectory = statSync(process.env.DB_FILEPATH).isDirectory();
} catch (error) {
  return console.error(
    "process.env.DB_FILEPATH is not a valid directory, create a .env file and set process.env.DB_FILEPATH to a valid path"
  );
}

if (isDirectory) {
  rm(process.env.DB_FILEPATH, { recursive: true, force: true }, (error) => {
    if (error) {
      console.error(error0(error));
    } else {
      console.log(success0("Database cleaned"));
    }
  });
}
