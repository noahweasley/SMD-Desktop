"use-strict";

const { clipboard } = require("electron");

//! don't touch SpotifyURLType, I tried to remove it once and there was a bug
//* I also don't even know what is depending on it, lol

// eslint-disable-next-line no-undef
module.exports.SpotifyURLType = SpotifyURLType = Object.freeze({
  TRACK: "track",
  PLAYLIST: "playlist",
  ALBUM: "album",
  ARTIST: "artist",
  UNKNOWN: "Unknown"
});

/**
 * @param {string} url the spotify url to be checked
 * @returns the type of url it is
 */
module.exports.getSpotifyURLType = function (url) {
  const clipboardContent = url || clipboard.readText();

  if (clipboardContent.includes("https://open.spotify.com")) {
    if (clipboardContent.search(this.SpotifyURLType.TRACK) != -1) return this.SpotifyURLType.TRACK;
    else if (clipboardContent.search(this.SpotifyURLType.PLAYLIST) != -1) return this.SpotifyURLType.PLAYLIST;
    else if (clipboardContent.search(this.SpotifyURLType.ALBUM) != -1) return this.SpotifyURLType.ALBUM;
    else if (clipboardContent.search(this.SpotifyURLType.ARTIST) != -1) return this.SpotifyURLType.ARTIST;
    else return this.SpotifyURLType.UNKNOWN;
  } else {
    throw new Error("Uh ohh !! That wasn't a spotify url");
  }
};
