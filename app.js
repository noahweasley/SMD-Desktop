'use-strict'

const {
    app,
    BrowserWindow,
    Menu,
    ipcMain
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

ipcMain.on('action-click-event', () => {
    console.log('message received')
})

function createWindow() {
    smd_window = new BrowserWindow({
        show: false,
        frame: false,
        width: 1000,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    Menu.setApplicationMenu(menu)
    smd_window.loadFile('index.html')
    smd_window.webContents.openDevTools()
    smd_window.once('ready-to-show', smd_window.show)
}