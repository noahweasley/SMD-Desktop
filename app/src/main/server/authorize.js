const { shell, dialog, BrowserWindow } = require("electron");
const express = require("express");
const server = express();
const path = require("path");
const spotifyWebApi = require("spotify-web-api-node");

const publicFilePath = path.resolve(__dirname, "../../public");
server.use(express.static(publicFilePath));

module.exports = function (settings) {
  const REDIRECT_URL = "http://localhost:8888/callback";
  const AUTHORIZE_URL = "http://localhost:8888/authorize";

  // TODO remove unused scopes

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
    "user-read-recently-played"
  ];

  const TIMEOUT = 60000;
  let timeout, connection, refreshTimer, authorizationCallback;

  const spotifyApi = new spotifyWebApi({ redirectUri: REDIRECT_URL });

  server.get("/authorize", async (_req, res) => {
    // Todo fix issue with spotifyApi.getClientId() returning null when it was already set
    if (!spotifyApi.getClientId() || !spotifyApi.getClientSecret()) {
      const [clientId, clientSecret] = await settings.getStates(["spotify-user-client-id", "spotify-user-client-secret"]);
      spotifyApi.setClientId(clientId);
      spotifyApi.setClientSecret(clientSecret);
    }

    const authURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authURL);

    timeout = setTimeout(() => {
      connection && connection.close();
      connection = null;
    }, TIMEOUT);
  });

  server.get("/callback", (req, res) => {
    const error = req.query.error;
    const code = req.query.code;

    if (error) {
      res.sendFile(path.resolve(__dirname, "../../public/failed.html"));
      connection.close();
      clearTimeout(timeout);
      clearTimeout(refreshTimer);
      refreshTimer = null;
      timeout = null;
      return;
    }

    spotifyApi.authorizationCodeGrant(code).then(async (response) => {
      const access_token = response.body["access_token"];
      const refresh_token = response.body["refresh_token"];
      const expires_in = response.body["expires_in"];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      res.sendFile(path.resolve(__dirname, "../../public/success.html"));

      let states = await settings.setStates({
        "spotify-access-token": access_token,
        "spotify-refresh-token": refresh_token,
        "spotify-token-expiration": expires_in,
        "spotify-secrets-received": true
      });

      if (states.length === 4) {
        if (authorizationCallback != null && authorizationCallback instanceof Function) {
          authorizationCallback();
          authorizationCallback = null;
        }
      } else {
        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
          title: "Server response incomplete",
          message: "Some data were not persisted, we might need to send another request and collect the data in the future"
        });
      }

      if (connection) connection.close();
      connection = null;
      refreshTimer = null;

      refreshTimer = setInterval(async () => {
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
  async function authorizeApp(args, callback) {
    authorizationCallback = callback;
    // start a server at port 8888 only if that server isn't alive
    if (!connection && args[2] == "auth-spotify") {
      let inserted = await settings.setStates({
        "spotify-user-client-id": args[0],
        "spotify-user-client-secret": args[1]
      });

      spotifyApi.setClientId(inserted[0]);
      spotifyApi.setClientSecret(inserted[1]);

      connection = server.listen(8888, () => shell.openExternal(AUTHORIZE_URL));
    }
  }

  /**
   * Refreshes the user's Spotify access token
   *
   * @returns true if the access token was refreshed
   */
  async function refreshSpotifyAccessToken() {
    let [clientId, clientSecret, refreshToken] = await settings.getStates([
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

      let states = await settings.setStates({
        "spotify-access-token": data.body["access_token"],
        "spotify-token-expiration": data.body["expires_in"]
      });

      return states.length == 2;
    } catch (error) {
      return false;
    }
  }

  /**
   * A simple wrapper to refresh access token and still handle errors
   */
  async function refreshSpotifyAccessTokenWithErrorHandler() {
    try {
      await refreshSpotifyAccessToken();
    } catch (err) {
      console.error("Access token refresh failed", err);
    }
  }

  return { authorizeApp, refreshSpotifyAccessToken, refreshSpotifyAccessTokenWithErrorHandler };
};
