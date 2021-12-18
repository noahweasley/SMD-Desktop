'use-strict'

window.addEventListener('DOMContentLoaded', () => {
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
})