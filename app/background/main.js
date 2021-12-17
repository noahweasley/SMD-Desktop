'use-strict'

const {
    app,
    BrowserWindow,
    ipcMain,
    shell,
    clipboard,
    dialog
} = require('electron')

const path = require('path')

const {
    SpotifyURLType,
    getSpotifyURLType
} = require('../background/util')

const express = require('../../node_modules/express');
const SpotifyWebApi = require('spotify-web-api-node');

// credentials are optional
const spotifyApi = new SpotifyWebApi({

});

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

const server = express();

server.get('/login', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

server.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;
    const state = req.query.state;

    if (error) {
        console.error('Callback Error:', error);
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

// ---------------------------------------------------------------------------------

let smd_window
let WINDOW_STATE

const State = Object.freeze({
    MAXIMIZED: 'window-maximized',
    MINIMIZED: 'window-minimized'
})

app.whenReady().then(() => {
    createWindow()
    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    smd_window = null
    if (process.platform !== 'darwin') app.quit()
})

// ... window acton click
ipcMain.on('action-click-event', (_event, id) => {
    if (id === 'window-action-close') {
        smd_window.close()
    } else if (id === 'window-action-minimize') {
        smd_window.minimize()
    } else {
        if (!!!WINDOW_STATE || WINDOW_STATE === State.MINIMIZED) {
            smd_window.maximize()
            WINDOW_STATE = State.MAXIMIZED
        } else {
            smd_window.restore()
            WINDOW_STATE = State.MINIMIZED
        }
    }

})

// ... support button click
ipcMain.on('donate', (_event) => {
    // donations
    shell.openExternal('https://www.buymeacoffee.com/noahweasley')
})

// ... clipboard content request
ipcMain.handle('clipboard-request', () => {
    const clipboardContent = clipboard.readText()
    const spotifyLinkRegex = new RegExp('https://open.spotify.com')
    if (spotifyLinkRegex.test(clipboardContent)) {
        // then ...
        let spotifyURLType = getSpotifyURLType(clipboardContent)
        switch (spotifyURLType) {
            case SpotifyURLType.TRACK:
                let track = clipboardContent.substring("https://open.spotify.com/track/".length, clipboardContent.length)

                spotifyApi.getTrack(track)
                    .then(data => {
                        const body = data.body
                        let name = body['name']
                        let artists = body.artists
                        let artistNames = []

                        artists.forEach(artist => {
                            artistNames.push(artist['name'])
                        })

                        console.log(`Track name: ${name}, artist: ${artistNames}`)

                    })
                    .catch(err => console.log('Error occurred'))

        }
    } else {
        dialog.showErrorBox("Clipboard content not a Spotify link", "Go to Spotify and copy playlist or song link, then click 'Paste URL'")
    }
})

/**
 * Spawns up a new SMD window with a limitations of 2 winodws
 */
function createWindow() {
    // only 2 window is allowed to be spawned
    if (BrowserWindow.getAllWindows().length == 2) return

    smd_window = new BrowserWindow({
        show: false,
        frame: false,
        minWidth: 800,
        minHeight: 400,
        width: 1000,
        height: 620,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, '../preload.js')
        }
    })
    // Menu.setApplicationMenu(menu)
    smd_window.loadFile(path.join('app', 'pages', 'index.html'))
    smd_window.once('ready-to-show', smd_window.show)
}