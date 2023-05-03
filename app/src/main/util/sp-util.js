const { clipboard } = require("electron");

function __exports() {
  /**
   * The list of supported links
   */
  const SpotifyURLType = Object.freeze({
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
  function getSpotifyURLType(url) {
    const clipboardContent = url || clipboard.readText();

    if (clipboardContent.includes("https://open.spotify.com")) {
      if (clipboardContent.search(SpotifyURLType.TRACK) !== -1) return SpotifyURLType.TRACK;
      else if (clipboardContent.search(SpotifyURLType.PLAYLIST) !== -1) return SpotifyURLType.PLAYLIST;
      else if (clipboardContent.search(SpotifyURLType.ALBUM) !== -1) return SpotifyURLType.ALBUM;
      else if (clipboardContent.search(SpotifyURLType.ARTIST) !== -1) return SpotifyURLType.ARTIST;
      else return SpotifyURLType.UNKNOWN;
    } else {
      throw new Error("Uh ohh !! That wasn't a spotify url");
    }
  }

  return { SpotifyURLType, getSpotifyURLType };
}

module.exports = __exports();
