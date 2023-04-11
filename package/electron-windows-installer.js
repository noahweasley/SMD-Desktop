const electronInstaller = require("electron-winstaller");
const chalk = require("chalk");
const { version: appVersion, productName } = require("../package.json");

const error0 = chalk.bold.red;
const success0 = chalk.green;
const info0 = chalk.blue;

const appDisplayName = "S.M.D_Desktop";
const appExecutableNameX32 = `${appDisplayName}_x32_v${appVersion}`;
const appExecutableNameX64 = `${appDisplayName}_x64_v${appVersion}`;

const githubIconUrl =
  "https://raw.githubusercontent.com/noahweasley/SMD-Desktop/master/app/resources/build/icons/win/icon.ico";

const settings64 = {
  name: appDisplayName,
  iconUrl: githubIconUrl,
  loadingGif: "./app/resources/build/tools/smd_installer.gif",
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: "./build/dist/win/SMD-Desktop-win32-x64",
  setupExe: `${appExecutableNameX64}-setup.exe`,
  outputDirectory: "./build/installers/win/x64",
  version: appVersion // use the version from package.json
};

const settings32 = {
  name: appDisplayName,
  iconUrl: githubIconUrl,
  loadingGif: "./app/resources/build/tools/smd_installer.gif",
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: "./build/dist/win/SMD-Desktop-win32-ia32",
  setupExe: `${appExecutableNameX32}-setup.exe`,
  outputDirectory: "./build/installers/win/x32",
  version: appVersion // use the version from package.json
};

(async function () {
  try {
    console.log(info0("Generating window installers, please wait..."));

    await electronInstaller.createWindowsInstaller(settings32);
    console.log(info0("Generated x32 bit window installers successfully"));

    await electronInstaller.createWindowsInstaller(settings64);
    console.log(info0("Generated x64 bit window installers successfully"));

    console.log(success0(`The installers for ${productName} were successfully created!!`));
  } catch (error) {
    console.log(error0(`Installer generation of ${productName} failed \n Message \n ${error.message}`));
  }
})();
