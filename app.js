const {app, BrowserWindow} = require('electron')

let smd_window

app.whenReady().then(createWindow)

function creatWindow() {
    smd_window = new BrowserWindow({
        
    })
}