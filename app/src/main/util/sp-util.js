"use-strict";

const { clipboard } = require("electron");

module.exports.SpotifyURLType = Object.freeze({
  TRACK: "track",
  PLAYLIST: "playlist",
  ALBUM: "album",
  ARTIST: "artist",
  UNKNOWN: "Unknown"
});

/**
 * @param {*} url the spotify url to be checked
 * @returns the type of url it is
 */
module.exports.getSpotifyURLType = function (url = "") {
  const spotifyLinkRegex = /[https://open.spotify.com]/;

  let clipboardContent = url || clipboard.readText();

  if (spotifyLinkRegex.test(clipboardContent)) {
    if (clipboardContent.search(this.SpotifyURLType.TRACK) != -1) return this.SpotifyURLType.TRACK;
    else if (clipboardContent.search(this.SpotifyURLType.PLAYLIST) != -1) return this.SpotifyURLType.PLAYLIST;
    else if (clipboardContent.search(this.SpotifyURLType.ALBUM) != -1) return this.SpotifyURLType.ALBUM;
    else if (clipboardContent.search(this.SpotifyURLType.ARTIST) != -1) return this.SpotifyURLType.ARTIST;
    else return this.SpotifyURLType.UNKNOWN;
  } else {
    throw new Error(`Uh ohh !! That wasn't a spotify url`);
  }
};
