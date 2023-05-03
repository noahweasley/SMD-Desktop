/* eslint-disable no-console */
const electronInstaller = require("electron-winstaller");
const chalk = require("chalk");
const { version: appVersion, productName } = require("../../package.json");

const error0 = chalk.bold.red;
const success0 = chalk.green;
const info0 = chalk.blue;
const info1 = chalk.yellow;

const sep = "-";
const appExecutableNameX32 = `${productName}${sep}x32${sep}v${appVersion}${sep}setup.exe`;
const appExecutableNameX64 = `${productName}${sep}x64${sep}v${appVersion}${sep}setup.exe`;

const githubIconUrl =
  "https://raw.githubusercontent.com/noahweasley/SMD-Desktop/master/app/resources/build/icons/win/icon.ico";

const settings64 = {
  noMsi: true,
  name: productName,
  iconUrl: githubIconUrl,
  loadingGif: "./app/resources/build/tools/smd_installer.gif",
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: `./build/dist/win/${productName}-win32-x64`,
  setupExe: appExecutableNameX64,
  outputDirectory: "./build/installers/win/x64",
  version: appVersion
};

const settings32 = {
  noMsi: true,
  name: productName,
  iconUrl: githubIconUrl,
  loadingGif: "./app/resources/build/tools/smd_installer.gif",
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: `./build/dist/win/${productName}-win32-ia32`,
  setupExe: appExecutableNameX32,
  outputDirectory: "./build/installers/win/x32",
  version: appVersion
};

(async function () {
  try {
    console.log(info0("Generating window installers, please wait..."));

    console.log(info1("Building for Window x32 bit"));
    await electronInstaller.createWindowsInstaller(settings32);
    console.log(info0("Generated x32 bit window installers successfully"));

    console.log(info1("Building for Window x64 bit"));
    await electronInstaller.createWindowsInstaller(settings64);
    console.log(info0("Generated x64 bit window installers successfully"));

    console.log(success0(`The installers for ${productName} were successfully created!!`));
  } catch (error) {
    console.log(error0(`Installer generation of ${productName} failed\n${error.message}`));
  }
})();
