module.exports = (settings) => ({
  aboutWindow: require("./about"),
  downloadWindow: require("./download"),
  mainWindow: require("./main")(settings),
  searchWindow: require("./search")
});
