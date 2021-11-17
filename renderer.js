window.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll('.window-action').forEach((action) => {

        action.addEventListener('click', event => {
            window.bridgeApis.send('action-click-event', action.id)
        })

    })
})