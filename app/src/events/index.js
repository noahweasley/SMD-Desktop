module.exports = (settings, browsers, database) => ({
  settings: require("./settings")(settings, browsers, database),
  about: require("./about")(settings, browsers, database),
  download: require("./download")(settings, browsers, database),
  main: require("./main")(settings, browsers, database)
});
