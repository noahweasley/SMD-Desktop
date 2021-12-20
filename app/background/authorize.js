const { shell } = require("electron");
const express = require("express");
const server = express();
const path = require("path");
const request = require("request");
const SpotifyWebApi = require("spotify-web-api-node");
const Settings = require("../background/settings/settings");

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

const TIMEOUT = 10000;
let timeout;
let connection;

const spotifyApi = new SpotifyWebApi({
  redirectUri: "http://localhost:8888/callback",
});

server.get("/authorize", (_req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
  timeout = setTimeout(() => connection.close(), TIMEOUT);
});

server.get("/callback", (req, res) => {
  const error = req.query.error;
  const code = req.query.code;

  if (error) {
    res.sendFile(path.join(__dirname, "../pages/failed.html"));
    connection.close();
    timeout = null;
    return;
  }

  spotifyApi.authorizationCodeGrant(code).then((data) => {
    const access_token = data.body["access_token"];
    const refresh_token = data.body["refresh_token"];
    const expires_in = data.body["expires_in"];

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    res.sendFile(path.join(__dirname, "../pages/success.html"));

    Settings.setState("spotify-access-token", access_token);
    Settings.setState("spotify-refresh-token", refresh_token);
    Settings.setState("spotify-token-expiration", expires_in);
    Settings.setState("secrets-received", true);

    connection.close();

    setInterval(async () => {
      const data = await spotifyApi.refreshAccessToken();
      const access_token = data.body["access_token"];
      spotifyApi.setAccessToken(access_token);
    }, (expires_in / 2) * 1000);
  });
});

module.exports.authorize = function (args) {
  spotifyApi.setClientId(args[0]);
  spotifyApi.setClientSecret(args[1]);
  Settings.setState("spotify-user-client-id", args[0]);
  Settings.setState("spotify-user-client-secret", args[1]);

  connection = server.listen(8888, () => shell.openExternal("http://localhost:8888/authorize"));
};

module.exports.refreshTokenAtInterval = function (interval) {
  // convert token expiration time to mil
  let tems = parseInt(Settings.getState("spotify-token-expiration", 3600)) * 1000;
  if (interval > 0) setInterval(() => refreshToken(), tems / interval);
  else refreshToken();

  function refreshToken() {
    const refresh_token = Settings.getState("spotify-refresh-token");
    const client_id = Settings.getState("spotify-user-client-id");
    const client_secret = Settings.getState("spotify-user-client-secret");

    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      headers: {
        Authorization: "Basic " + new Buffer(client_id + ":" + client_secret).toString("base64"),
      },
      form: {
        grant_type: "refresh_token",
        refresh_token: refresh_token,
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        console.log(access_token);
        if (err) {
          console.log(`Refresh error occurred retrying in: ${tems / interval}`);
        } else Settings.setState("spotify-access-token", access_token);
      }
    });
  }
};
