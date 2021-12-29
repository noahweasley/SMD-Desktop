const { Menu } = require("electron");

module.exports = Menu.buildFromTemplate([
  {
    label: "Reload",
    role: "reload"
  },
  {
    label: "Force Reload",
    role: "forceReload"
  },
  {
    label: "Toggle Dev tools",
    role: "toggleDevTools"
  },
]);