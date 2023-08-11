/* eslint-disable no-console */
const { unlink } = require("fs");
const chalk = require("chalk");
require("dotenv").config();

const info0 = chalk.blue;
const error0 = chalk.bold.red;
const success0 = chalk.green;

console.log(info0("Cleaning debug preference..."));

unlink(process.env.PREF_FILEPATH, (error) => {
  if (error) {
    console.error(error0(error));
  } else {
    console.log(success0("Preference cleaned"));
  }
});
