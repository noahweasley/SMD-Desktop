module.exports = (settings) => {
  return {
    aboutWindow: require("./about"),
    downloadWindow: require("./download"),
    mainWindow: require("./main")(settings),
    multiSearchWindow: require("./multi-search"),
    singleSearchWindow: require("./single-search")
  };
  
};

