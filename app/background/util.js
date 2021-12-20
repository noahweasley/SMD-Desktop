"use-strict";

module.exports.SpotifyURLType = SpotifyURLType = Object.freeze({
  TRACK: "track",
  PLAYLIST: "playlist",
  ALBUM: "album",
  ARTIST: "artist",
  UNKNOWN: "unknown",
});

/**
 * @param {*} url the spotify url to be checked
 * @returns the type of url it is
 */
module.exports.getSpotifyURLType = function (url = "") {
  const spotifyLinkRegex = new RegExp("https://open.spotify.com");

  if (spotifyLinkRegex.test(url)) {
    if (url.search(this.SpotifyURLType.TRACK) != -1) return this.SpotifyURLType.TRACK;
    else if (url.search(this.SpotifyURLType.PLAYLIST) != -1) return this.SpotifyURLType.PLAYLIST;
    else if (url.search(this.SpotifyURLType.ALBUM) != -1) return this.SpotifyURLType.ALBUM;
    else if (url.search(this.SpotifyURLType.ARTIST) != -1) return this.SpotifyURLType.ARTIST;
    else return this.SpotifyURLType.UNKNOWN;
  } else {
    throw new Error(url + " is not a spotify url");
  }
};
