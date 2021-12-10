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

})