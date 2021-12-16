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

const SpotifyWebApi = require('spotify-web-api-node')

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