const SpotifyWebApi = require("spotify-web-api-node");
const { dialog, clipboard } = require("electron");
const { SpotifyURLType, getSpotifyURLType } = require("../../main/util/sp-util");

module.exports = function (settings) {
  const MAX_NUMBER_OF_RETRIES = 3;
  const REDIRECT_URL = "http://localhost:8888/callback";
  const spotifyApi = new SpotifyWebApi({ redirectUri: REDIRECT_URL });

  /**
   * starts album metadata query
   *
   * @param  {string} albumUrl the album identifier to be used in the metadata query
   * @param {number} limit the maximum number of items to fetch
   * @throws error if error occurred while fetching data, this can be caused by network
   */
  async function searchSpotifyAlbum(albumUrl, limit = 50) {
    const album = albumUrl.substring("https://open.spotify.com/album/".length, albumUrl.length);
    let data, dataReceived;

    for (let x = 0; x <= MAX_NUMBER_OF_RETRIES; x++) {
      try {
        data = await spotifyApi.getAlbumTracks(album, { limit });
        dataReceived = true;
        break;
      } catch (err) {
        await refreshSpotifyAccessTokenWithErrorHandler();
      }
    }

    if (!dataReceived) return "An error occurred while retrieving album data";

    const body = data.body;
    const tracks = body.tracks.items;
    const name = body.name;
    const thumbnails = body.images.map((thumbnail) => thumbnail.url);

    const trackCollection = [];

    tracks.forEach((track) => {
      const songTitle = track.name;
      const artists = track.artists;
      const artistNames = artists.map((artist) => artist.name);
      const thumbnails = track.images;
      trackCollection.push({ thumbnails, songTitle, artistNames });
    });

    return {
      type: SpotifyURLType.ALBUM,
      description: { thumbnails, name, trackCollection }
    };
  }

  /**
   * starts artist metadata query
   *
   * @param {string} _artistUrl the artist identifier to be used in the metadata query
   * @throws error if error occurred while fetching data, this can be caused by network
   */
  async function searchSpotifyArtist() {
    return "Artist URL support coming soon, try again later";
  }

  /**
   * starts playlist metadata query
   *
   * @param {string} playlistUrl the playlist identifier to be used in metadata query
   * @throws error if error occurred while fetching data, this can be caused by network
   */
  async function searchSpotifyPlaylist(playlistUrl) {
    const playlist = playlistUrl.substring("https://open.spotify.com/playlist/".length, playlistUrl.length);
    let data, dataReceived;

    for (let x = 0; x <= MAX_NUMBER_OF_RETRIES; x++) {
      try {
        data = await spotifyApi.getPlaylist(playlist);
        dataReceived = true;
        break;
      } catch (err) {
        await refreshSpotifyAccessTokenWithErrorHandler();
      }
    }

    if (!dataReceived) return "An error occurred while retrieving playlist data";

    const body = data.body;
    const name = body.name;
    const tracks = body.tracks;
    const thumbnails = body.images.map((thumbnail) => thumbnail.url);

    const trackCollection = tracks.items
      .map((i) => i.track)
      .map((tr) => ({ songTitle: tr.name, artistNames: tr.artists.map((artist) => artist.name) }));

    return {
      type: SpotifyURLType.PLAYLIST,
      description: { thumbnails, name, trackCollection }
    };
  }

  /**
   * starts track metadata query
   *
   * @param {string} track the track identifier to be used in metadata query
   * @throws error if error occurred while fetching data, this can be caused by network
   */
  async function searchSpotifyTrack(trackUrl) {
    const track = trackUrl.substring("https://open.spotify.com/track/".length, trackUrl.length);
    let data, dataReceived;

    for (let x = 0; x <= MAX_NUMBER_OF_RETRIES; x++) {
      try {
        data = await spotifyApi.getTrack(track);
        dataReceived = true;
        break;
      } catch (err) {
        await refreshSpotifyAccessTokenWithErrorHandler();
      }
    }

    if (!dataReceived) return "An Error occurred while retrieving track data";

    const body = data.body;
    const songTitle = body.name;
    const artists = body.artists;
    let artistNames = [];

    artistNames = artists.map((artist) => artist.name);

    return {
      type: SpotifyURLType.TRACK,
      description: { songTitle, artistNames }
    };
  }

  /**
   * @param {string} urlType the url type as specified by `SpotifyURLType`
   *
   * @returns an object with the requested Spotify data
   */
  async function getSpotifyLinkData(urlType) {
    let data, spotifyURLType;
    const clipboardContent = clipboard.readText();

    try {
      spotifyURLType = urlType || getSpotifyURLType(clipboardContent);
    } catch (error) {
      // display modal dialog with details of error
      dialog.showErrorBox(
        "Clipboard content not a Spotify link",
        "Clipboard content has changed, go to Spotify and copy link again, then click 'Paste URL'"
      );

      return error.message;
    }

    const [spotifyUserClientId, spotifyClientSecret, spotifyAccessToken, spotifyRefreshToken] = await settings.getStates([
      "spotify-user-client-id",
      "spotify-user-client-secret",
      "spotify-access-token",
      "spotify-refresh-token"
    ]);

    spotifyApi.setClientId(spotifyUserClientId);
    spotifyApi.setClientSecret(spotifyClientSecret);
    spotifyApi.setAccessToken(spotifyAccessToken);
    spotifyApi.setRefreshToken(spotifyRefreshToken);

    if (clipboardContent.includes("https://open.spotify.com")) {
      switch (spotifyURLType) {
        case SpotifyURLType.TRACK:
          data = searchSpotifyTrack(clipboardContent);
          break;
        case SpotifyURLType.ALBUM:
          data = searchSpotifyAlbum(clipboardContent);
          break;
        case SpotifyURLType.ARTIST:
          data = searchSpotifyArtist(clipboardContent);
          break;
        case SpotifyURLType.PLAYLIST:
          data = searchSpotifyPlaylist(clipboardContent);
          break;
        default:
          throw new Error(`${spotifyURLType} link is either incomplete or is not supported yet`);
      }
    } else {
      // display modal dialog with details of error
      dialog.showErrorBox(
        "Clipboard content not a Spotify link",
        "Clipboard content has changed, go to Spotify and copy link, then click 'Paste URL'"
      );
    }

    return data;
  }

  /**
   * Refreshes the user's Spotify access token
   *
   * @returns true if the access token was refreshed
   */
  async function refreshSpotifyAccessToken() {
    const [clientId, clientSecret, refreshToken] = await settings.getStates([
      "spotify-user-client-id",
      "spotify-user-client-secret",
      "spotify-refresh-token"
    ]);

    spotifyApi.setClientId(clientId);
    spotifyApi.setClientSecret(clientSecret);
    spotifyApi.setRefreshToken(refreshToken);

    let data;
    try {
      data = await spotifyApi.refreshAccessToken();

      const states = await settings.setStates({
        "spotify-access-token": data.body["access_token"],
        "spotify-token-expiration": data.body["expires_in"]
      });

      return states.length === 2;
    } catch (error) {
      return false;
    }
  }

  /**
   * A simple wrapper to refresh access token and still handle errors
   */
  async function refreshSpotifyAccessTokenWithErrorHandler() {
    try {
      return await refreshSpotifyAccessToken();
    } catch (err) {
      console.error("Access token refresh failed");
      return false;
    }
  }

  return {
    spotifyApi,
    searchSpotifyAlbum,
    searchSpotifyArtist,
    searchSpotifyPlaylist,
    searchSpotifyTrack,
    getSpotifyLinkData,
    refreshSpotifyAccessToken,
    refreshSpotifyAccessTokenWithErrorHandler
  };
};
