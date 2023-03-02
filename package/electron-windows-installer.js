const electronInstaller = require("electron-winstaller");
const appVersion = require("../package.json").version;

const appDisplayName = "S.M.D-Desktop";
const appExecutableName = "smddesktop";

const settings64 = {
  name: appExecutableName,
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: "./build/dist/win/SMD-Desktop-win32-x64",
  setupExe: `${appDisplayName}-setup.exe`,
  outputDirectory: "./build/installers/win/x64",
  version: appVersion // use the version from package.json
};

const settings32 = {
  name: appExecutableName,
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: "./build/dist/win/SMD-Desktop-win32-ia32",
  setupExe: `${appDisplayName}-setup.exe`,
  outputDirectory: "./build/installers/win/x32",
  version: appVersion // use the version from package.json
};

const createWindowsInstaller = Promise.all([
  electronInstaller.createWindowsInstaller(settings32),
  electronInstaller.createWindowsInstaller(settings64)
]);

createWindowsInstaller
  .then(
    () => {
      console.log("The installers of your application were successfully created !");
    },
    (error) => {
      console.log(`Installer generation of ${appDisplayName} failed: ${error.message}`);
    }
  )
  .catch((error) => console.log(`Installer generation of ${appDisplayName} failed: ${error.message}`));
