const express = require('express');
const server = express();

const scopes = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
];


server.get('/login', (_req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

server.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    // const state = req.query.state;

    if (error) {
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotifyApi
        .authorizationCodeGrant(code)
        .then(data => {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            const expires_in = data.body['expires_in'];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            res.send('Success! You can now close the window.');

            setInterval(async () => {
                const data = await spotifyApi.refreshAccessToken();
                const access_token = data.body['access_token'];
                spotifyApi.setAccessToken(access_token);
            }, expires_in / 2 * 1000);
        })
});

server.listen(8888, () =>
    shell.openExternal("http://localhost:8888/login")
);