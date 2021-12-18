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

function dataReveal() {
    const windowContent = document.querySelector('.window')
    const modal = document.querySelector('.modal')
    const titileBar = document.querySelector('.toolbar-header')
    titileBar.classList.remove('gone')
    windowContent.classList.remove('gone')
    modal.style.setProperty('display', 'none')

    window.bridgeApis.invoke('get-states', ['secrets-received', 'false'])
        .then(value => {
            if (value === "true") windowContent.classList.remove('gone')
            else {
                // modal.style.setProperty('display', 'flex')
            }
        })

    // window.bridgeApis.invoke('set-states', ['data3', `Created at: ${Date.now()}`])
    //     .then(result => {
    //         console.log(result)
    //     })

}

// ... user interactions on window

window.addEventListener('DOMContentLoaded', () => {
    dummyAnimate(0)
    // ---      download inter-process communication   ---
    window.bridgeApis.on('download-progress-update', event => {

    })
})