const SpotifyWebApi = require("spotify-web-api-node");
const spotifyApi = new SpotifyWebApi();

/**
 * starts album downlaod
 *
 * @param albumUrl the album identifier to be used in download
 * @throws error if error occurred while fetching data, this can be caused by network
 */
module.exports.performAlbumDownloadAction = async function (albumUrl, limit = 50) {
  let album = albumUrl.substring("https://open.spotify.com/album/".length, albumUrl.length);
  let data, dataReceived;

  for (let x = 0; x <= 3; x++) {
    try {
      data = await spotifyApi.getAlbumTracks(album, { limit });
      dataReceived = true;
      break;
    } catch (err) {
      await refreshSpoifyAccessToken();
    }
  }

  if (!dataReceived) return "An error occurred while retrieving album data";

  const tracks = data.body["tracks"].items;
  const albumName = data.body["name"];
  const thumbnails = data.body["images"].map((thumb) => thumb.url);

  let albumTracks = [];

  tracks.forEach((track) => {
    let songTitle = track["name"];
    let artists = track["artists"];
    let artistNames = artists.map((artist) => artist["name"]);
    let thumbnails = track["images"];
    albumTracks.push({ thumbnails, songTitle, artistNames });
  });

  return {
    type: SpotifyURLType.ALBUM,
    description: { thumbnails, albumName, albumTracks }
  };
};

/**
 * starts artist download
 *
 * @param artistUrl the artist identifier to be used in download
 * @throws error if error occurred while fetching data, this can be caused by network
 */
module.exports.performArtistDownloadAction = async function (artistUrl) {
  return "Artist URL support coming soon, try again later";
};

/**
 * starts playlist download
 *
 * @param playlistUrl the playlist identifier to be used in download
 * @throws error if error occurred while fetching data, this can be caused by network
 */
module.exports.performPlaylistDownloadAction = async function (playlistUrl) {
  let playlist = playlistUrl.substring("https://open.spotify.com/playlist/".length, playlistUrl.length);
  let data, dataReceived;

  for (let x = 0; x <= 3; x++) {
    try {
      data = await spotifyApi.getPlaylist(playlist);
      dataReceived = true;
      break;
    } catch (err) {
      refreshSpoifyAccessToken();
    }
  }

  if (!dataReceived) return "An error occurred while retrieving playlist data";

  const body = data.body;
  const playListName = body["name"];
  const tracks = body["tracks"];
  const thumbnails = data.body["images"].map((thumb) => thumb.url);

  let trackCollection = tracks["items"]
    .map((i) => i.track)
    .map((tr) => {
      return { songTitle: tr["name"], artistNames: tr["artists"].map((artist) => artist.name) };
    });

  return {
    type: SpotifyURLType.PLAYLIST,
    description: { thumbnails, playListName, trackCollection }
  };
};

/**
 * starts track download
 *
 * @param track the track identifier to be used in download
 * @throws error if error occurred while fetching data, this can be caused by network
 */
module.exports.performTrackDownloadAction = async function (trackUrl) {
  let track = trackUrl.substring("https://open.spotify.com/track/".length, trackUrl.length);
  let data, dataReceived;

  for (let x = 0; x <= 3; x++) {
    try {
      data = await spotifyApi.getTrack(track);
      dataReceived = true;
      break;
    } catch (err) {
      refreshSpoifyAccessToken();
    }
  }

  if (!dataReceived) return "An Error occurred while retrieving track data";

  const body = data.body;
  let songTitle = body["name"];
  let artists = body["artists"];
  let artistNames = [];

  artistNames = artists.map((artist) => artist["name"]);

  return {
    type: SpotifyURLType.TRACK,
    description: { songTitle, artistNames }
  };
};
