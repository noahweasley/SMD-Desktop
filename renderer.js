window.addEventListener('DOMContentLoaded', () => {
    // window action button clicked
    document.querySelectorAll('.window-action').forEach((action) => {
        action.addEventListener('click', (_event) => {
            window.bridgeApis.send('action-click-event', action.id)
        })
    })

    //...
    document.querySelector('.donate').addEventListener('click', (_event) => {
        window.bridgeApis.send('donate')
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
    tabItems.forEach((tabItem) => {
        tabItem.addEventListener('click', (_event) => {
            // remove nav-item acive state
            for (x = 0; x < tabItems.length; x++) {
                tabItems[x].classList.remove('active')
            }
            tabItem.classList.add('active')
        })

    })

})