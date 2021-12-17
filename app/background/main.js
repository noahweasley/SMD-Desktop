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

const Settings = require('../background/settings/settings')

const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');

// credentials are optional
const spotifyApi = new SpotifyWebApi({
    redirectUri: 'http://localhost:8888/callback',
    clientId: '2209fc75807e46049a7961b6a64163b8',
    clientSecret: 'ffdb7e9493374b0e927cb9f456b218ab'
});

// ---------------------------------------------------------------------------------

let smd_window
let WINDOW_STATE

const State = Object.freeze({
    MAXIMIZED: 'window-maximized',
    MINIMIZED: 'window-minimized'
})

app.whenReady().then(() => {
    createPreferenceFile()
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

// ... settings requests
ipcMain.handle('get-states', (_event, args) => {
    return Settings.getState(args[0], args[1])
})

// ... settings requests
ipcMain.handle('set-states', (_event, args) => {
    return Settings.setState(args[0], args[1])
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
                performTrackDownloadAction(clipboardContent)
                break
            case SpotifyURLType.ALBUM:
                performAlbumDownloadAction(clipboardContent)
                break
            case SpotifyURLType.ARTIST:
                performArtistDownloadAction(clipboardContent)
                break
            default:
                throw new Error(`${spotifyURLType} is not supported yet`)
        }
    } else {
        // ... display modal dialog with details of error
        dialog.showErrorBox("Clipboard content not a Spotify link", "Go to Spotify and copy playlist or song link, then click 'Paste URL'")
    }
})

/**
 * starts album downlaod
 * @param {*} album the album identifier to be used in download
 */
function performAlbumDownloadAction(albumUrl) {}

/**
 * starts artist download
 * @param {*} the artist identifier to be used in download
 */
function performArtistDownloadAction(artistUrl) {}

/**
 * 
 */
function performTrackDownloadAction(trackUrl) {
    let track = trackUrl.substring("https://open.spotify.com/track/".length, trackUrl.length)

    spotifyApi.getTrack(track).then(data => {
        const body = data.body
        let name = body['name']
        let artists = body.artists
        let artistNames = []

        artistNames = artists.map(artist => artist['name'])

        console.log(`Track name: ${name}, artist: ${artistNames}`)

    }).catch(_err => console.log('Error occurred'))
}

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

/**
 * create the settings data in app's path
 */
function createPreferenceFile() {
    const prefDir = path.join(app.getPath('userData'), 'preference')
    const preferenceFilePath = path.join(prefDir, 'preference.json')

    fs.open(preferenceFilePath, 'wx', (err, fd) => {
        if (err) {
            if (err.code === 'EEXIST') return
            console.log('An error occurred while opening file')
        } else {
            fs.mkdir(prefDir, {
                recursive: true
            }, function (err) {
                if (err) console.log('An error occurred while creating directory')
            })

            fs.writeFile(preferenceFilePath, "{}", err => {
                if (err) console.log('An error occurred while creating file')
            })
        }
    })
}