/* eslint-disable no-console */
const { rm } = require("fs");
const { join } = require("path");
const chalk = require("chalk");
const path = require("path");

const info0 = chalk.blue;
const error0 = chalk.bold.red;
const success0 = chalk.green;

console.log(info0("Cleaning build..."));

rm(path.resolve("build"), { recursive: true, force: true }, (error) => {
  if (error) {
    console.error(error0(error));
  } else {
    console.log(success0("Build cleaned"));
  }
});
