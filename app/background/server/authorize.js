const Settings = require("../settings/settings");
const { shell } = require("electron");
const express = require("express");
const server = express();
const path = require("path");
const SpotifyWebApi = require("spotify-web-api-node");

const scopes = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "app-remote-control",
  "user-read-email",
  "user-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-read-private",
  "playlist-modify-private",
  "user-library-read",
  "user-top-read",
  "user-read-playback-position",
  "user-read-recently-played",
];

const TIMEOUT = 60000;
let timeout;
let connection;

const spotifyApi = new SpotifyWebApi({
  redirectUri: "http://localhost:8888/callback",
});

server.get("/authorize", (_req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
  timeout = setTimeout(() => {
    connection.close();
    connection = null;
  }, TIMEOUT);
});

server.get("/callback", (req, res) => {
  const error = req.query.error;
  const code = req.query.code;

  if (error) {
    res.sendFile(path.join(__dirname, "../../pages/failed.html"));
    connection.close();
    timeout = null;
    return;
  }

  spotifyApi.authorizationCodeGrant(code).then(async (data) => {
    const access_token = data.body["access_token"];
    const refresh_token = data.body["refresh_token"];
    const expires_in = data.body["expires_in"];

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    res.sendFile(path.join(__dirname, "../../pages/success.html"));

    await Settings.setStates({
      "spotify-access-token": access_token,
      "spotify-refresh-token": refresh_token,
      "spotify-token-expiration": expires_in,
      "spotify-secrets-received": true,
    });

    connection.close();
    connection = null;

    setInterval(async () => {
      const data = await spotifyApi.refreshAccessToken();
      const access_token = data.body["access_token"];
      spotifyApi.setAccessToken(access_token);
    }, (expires_in / 2) * 1000);
  });
});

/**
 * Starts a server to authorize Spotify details using the Authorization flow
 *
 * @param args [0] = Client ID , [1] = Client secret, [2] authorization method
 */
module.exports.authorizeApp = async function (args) {
  // start a server at port 8888 only if that server isn't alive
  if (!connection && args[2] == "auth-spotify") {
    let inserted = await Settings.setStates({
      "spotify-user-client-id": args[0],
      "spotify-user-client-secret": args[1],
    });

    spotifyApi.setClientId(inserted[0]);
    spotifyApi.setClientSecret(inserted[1]);

    connection = server.listen(8888, () => shell.openExternal("http://localhost:8888/authorize"));
  }
};

/**
 * Refreshes the user's Spotify access token
 *
 * @returns true if the access token was refreshed
 */
module.exports.refreshSpoifyAccessToken = async function () {
  let [clientId, clientSecret, refreshToken] = await Settings.getStates([
    "spotify-user-client-id",
    "spotify-user-client-secret",
    "spotify-refresh-token",
  ]);

  spotifyApi.setClientId(clientId);
  spotifyApi.setClientSecret(clientSecret);
  spotifyApi.setRefreshToken(refreshToken);

  let data;
  try {
    data = await spotifyApi.refreshAccessToken();
    console.log("New Access Token:", data.body["access_token"]);
    
    let states = await Settings.setStates({
      "spotify-access-token": data.body["access_token"],
      "spotify-refresh-token": data.body["refresh_token"],
      "spotify-token-expiration": data.body["expires_in"],
    });

    return states.length == 3;
  } catch (error) {
    console.log("Error refreshing: ", error.message);
    return false;
  }
};
