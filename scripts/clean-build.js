const { rm } = require("fs");
const { join } = require("path");
const chalk = require("chalk");

const info0 = chalk.blue;
const error0 = chalk.bold.red;
const success0 = chalk.green;

console.log(info0("Deleting build folder"));

rm(join(__dirname, "../build"), { recursive: true, force: true }, (error) => {
  if (error) {
    console.error(error0(error));
  } else {
    console.log(success0("Build folder deleted"));
  }
});
