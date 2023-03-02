const electronInstaller = require("electron-winstaller");

const appName = "S.M.D Desktop";

const settings64 = {
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: "./build/dist/win/SMD-Desktop-win32-x64",
  outputDirectory: "./build/installers/win/x64"
};

const settings32 = {
  setupIcon: "./app/resources/build/icons/win/icon.ico",
  appDirectory: "./build/dist/win/SMD-Desktop-win32-ia32",
  outputDirectory: "./build/installers/win/x32"
};

const createWindowsInstaller = Promise.all([
  electronInstaller.createWindowsInstaller(settings32),
  electronInstaller.createWindowsInstaller(settings64)
]);

createWindowsInstaller.then(
  () => {
    console.log("The installers of your application were successfully created !");
  },
  (error) => {
    console.log(`Installer generation of ${appName} failed: ${error.message}`);
  }
);
