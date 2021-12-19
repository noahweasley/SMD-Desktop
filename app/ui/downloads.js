'use-strict'

function setProgress(elementId, prog) {
    const progress = document.getElementById(elementId)
    progress.style.setProperty('--progress-width', prog)
    progress.style.setProperty('--progress-anim', 'none')
}

function setDownloadProgress(listPos, progress) {

}

function dummyAnimate(listPos) {
    let progress = 0
    setTimeout(() => {
        setInterval(() => {
            setProgress(`download-progress-${listPos}`, `${progress = progress === 100 ? progress = 0: progress+=2}%`)
        }, 1000)
    }, 10000)
}

// ... user interactions on window
window.addEventListener('DOMContentLoaded', () => {
    dummyAnimate(0)
    // ---      download inter-process communication   ---
    window.bridgeApis.on('download-progress-update', event => {

    })
})