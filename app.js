'use-strict'

const {
    app,
    BrowserWindow,
    Menu
} = require('electron')

const path = require('path')
const menu = require('./menu')

let smd_window

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

function createWindow() {
    smd_window = new BrowserWindow({
        show: false,
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    Menu.setApplicationMenu(menu)
    smd_window.loadFile('index.html')
    smd_window.once('ready-to-show', smd_window.show)
}