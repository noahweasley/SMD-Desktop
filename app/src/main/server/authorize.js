const { shell, dialog, BrowserWindow } = require("electron");
const express = require("express");
const server = express();
const path = require("path");

const publicFilePath = path.resolve(__dirname, "../../public");
server.use(express.static(publicFilePath));

module.exports = function (settings, spotifyApi) {
  const AUTHORIZE_URL = "http://localhost:8888/authorize";

  const scopes = [
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "user-read-playback-position",
    "user-read-email",
    "playlist-read-collaborative",
    "user-library-read",
    "user-top-read",
    "user-read-recently-played"
  ];

  const TIMEOUT = 60000;
  let timeout, connection, refreshTimer, authorizationCallback;

  server.get("/authorize", async (_req, res) => {
    // TODO: fix issue with spotifyApi.getClientId() returning null when it was already set
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
      const accessToken = response.body["access_token"];
      const refreshToken = response.body["refresh_token"];
      const expireIn = response.body["expires_in"];

      spotifyApi.setAccessToken(accessToken);
      spotifyApi.setRefreshToken(refreshToken);

      res.sendFile(path.resolve(__dirname, "../../public/success.html"));

      const states = await settings.setStates({
        "spotify-access-token": accessToken,
        "spotify-refresh-token": refreshToken,
        "spotify-token-expiration": expireIn,
        "spotify-secrets-received": true
      });

      if (states.length === 4) {
        if (authorizationCallback != null) {
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
        try {
          const data = await spotifyApi.refreshAccessToken();
          const accessToken = data.body["access_token"];
          spotifyApi.setAccessToken(accessToken);
        } catch (error) {
          console.error("Refresh failed", error);
        }
      }, (expireIn / 2) * 1000);
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
      const inserted = await settings.setStates({
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
      return await refreshSpotifyAccessToken();
    } catch (err) {
      console.error("Access token refresh failed");
      return false;
    }
  }

  return { authorizeApp, refreshSpotifyAccessToken, refreshSpotifyAccessTokenWithErrorHandler };
};
