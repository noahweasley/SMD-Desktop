'use-strict'

window.addEventListener('DOMContentLoaded', () => {
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