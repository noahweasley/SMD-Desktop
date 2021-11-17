window.addEventListener('DOMContentLoaded', () => {
    // window action button clicked
    document.querySelectorAll('.window-action').forEach((action) => {
        action.addEventListener('click', event => {
            window.bridgeApis.send('action-click-event', action.id)
        })

    })
    
    //...
})