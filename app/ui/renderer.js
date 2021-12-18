'use-strict'

let api

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
    modal.style.setProperty('display', 'flex')
    
    window.bridgeApis.invoke('get-states', ['secrets-received', 'false'])
    .then(value => {
            if (value === "true") windowContent.classList.remove('gone')
            else {
                modal.style.setProperty('display', 'flex')
            }
        })

    // window.bridgeApis.invoke('set-states', ['data3', `Created at: ${Date.now()}`])
    //     .then(result => {
    //         console.log(result)
    //     })

}

// ... user interactions on window

window.addEventListener('DOMContentLoaded', () => {
    api = window.bridgeApis

    dummyAnimate(0)

    // deactive link default actions 
    document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (event) => {
                event.preventDefault()
                window.bridgeApis.send('navigate-link', link.getAttribute('href'))
            })
        })
        // window action button clicked
    document.querySelectorAll('.window-action').forEach((action) => {
        action.addEventListener('click', (_event) => {
            window.bridgeApis.send('action-click-event', action.id)
        })
    })

    // 3 seconds time delay before displaying contents to user ...
    setTimeout(dataReveal, 3000)

    //...
    document.querySelector('.donate').addEventListener('click', (_event) => {
        window.bridgeApis.send('navigate-link', 'https://www.buymeacoffee.com/noahweasley')
    })

    // ...
    document.querySelector('.paste').addEventListener('click', () => {
        window.bridgeApis.invoke('clipboard-request')
            .then(content => {
                console.log(content)
            })
    })

    //...
    let navItems = document.querySelectorAll('.nav-group-item')
    navItems.forEach((navItem) => {
        navItem.addEventListener('click', (_event) => {
            // remove nav-item acive state
            for (x = 0; x < navItems.length; x++) {
                navItems[x].classList.remove('active')
            }
            navItem.classList.add('active')
        })

    })

    //...
    let tabItems = document.querySelectorAll('.__tab-item')

    // ...
    let tabContent_Downloading = document.getElementById('tab-content__downloading')
    let tabContent_Downloaded = document.getElementById('tab-content__downloaded')

    tabItems.forEach((tabItem) => {

        tabItem.addEventListener('click', (_event) => {
            // remove nav-item acive state
            for (x = 0; x < tabItems.length; x++) {
                tabItems[x].classList.remove('active')
            }
            tabItem.classList.add('active')

            // toggle tab content visibility
            if (tabItem.id == '__tab-item__downloading') {
                if (!tabContent_Downloaded.classList.contains('invisible')) {
                    tabContent_Downloaded.classList.add('invisible')
                }

                tabContent_Downloading.classList.remove('invisible')

            } else {
                if (!tabContent_Downloading.classList.contains('invisible')) {
                    tabContent_Downloading.classList.add('invisible')
                }

                tabContent_Downloaded.classList.remove('invisible')

            }

        })

    })

    // ---      download inter-process communication   ---

    window.bridgeApis.on('download-progress-update', event => {

    })
})