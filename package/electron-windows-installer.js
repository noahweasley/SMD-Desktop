const electronInstaller = require("electron-winstaller");
const appVersion = require("../package.json").version;

const appExecutableName = "S.M.D_Desktop";

const settings64 = {
  name: appExecutableName,
  loadingGif: "./app/resources/build/tools/smd_installer.gif",
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: "./build/dist/win/SMD-Desktop-win32-x64",
  setupExe: `${appExecutableName}-setup.exe`,
  outputDirectory: "./build/installers/win/x64",
  version: appVersion // use the version from package.json
};

const settings32 = {
  name: appExecutableName,
  loadingGif: "./app/resources/build/tools/smd_installer.gif",
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: "./build/dist/win/SMD-Desktop-win32-ia32",
  setupExe: `${appExecutableName}-setup.exe`,
  outputDirectory: "./build/installers/win/x32",
  version: appVersion // use the version from package.json
};

(async function () {
  try {
    await electronInstaller.createWindowsInstaller(settings32);
    await electronInstaller.createWindowsInstaller(settings64);
    console.log("The installers of your application were successfully created !");
  } catch (error) {
    console.log(`Installer generation of ${appExecutableName} failed: ${error.message}`);
  }
})();
