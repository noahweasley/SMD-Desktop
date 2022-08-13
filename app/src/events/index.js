"use=strict";

module.exports = (settings, browsers, database) => {
  let queryDownloadData;
  return {
    settings: require("./settings")(settings, browsers, database, queryDownloadData),
    about: require("./about")(settings, browsers, database, queryDownloadData),
    download: require("./download")(settings, browsers,database, queryDownloadData),
    main: require("./main")(settings, browsers, database, queryDownloadData)
  };
};
