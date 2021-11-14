'use strict';

const {
    contextBridge,
    ipcRenderer
} = require('electron');

// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
    contextBridge.exposeInMainWorld(
        "bridgeApis", {
            send: (channel, data) => ipcRenderer.send(channel, data),
            on: (channel, callback) => ipcRenderer.on(channel, callback),
        }
    );

    document.querySelectorAll('.window-action').forEach(action, () => {
        action.addEventListener('click', event => {
            ipcRenderer.send('action-click-event', event.target.id)
        })

    })
});