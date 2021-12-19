'use-strict'

function getElementIndex(element) {
    return Array.from(element.parentNode.children).indexOf(element);
}

function registerTabEvents(tabItem, ...tabContent) {
    //...
    let tabItems = document.querySelectorAll(tabItem)

    // ...
    let tabContent_Downloading = document.getElementById(tabContent[0])
    let tabContent_Downloaded = document.getElementById(tabContent[1])

    tabItems.forEach((tabItem) => {

        tabItem.addEventListener('click', (_event) => {
            // remove nav-item acive state
            for (x = 0; x < tabItems.length; x++) {
                tabItems[x].classList.remove('active')
            }
            tabItem.classList.add('active')

            // toggle tab content visibility
            if (getElementIndex(tabItem) === 0) {
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

}

window.addEventListener('DOMContentLoaded', () => {
    registerTabEvents('.__tab-item', 'tab-content__downloading', 'tab-content__downloaded')
    registerTabEvents('.tab-item__form', 'tab-content__form__spotify', 'tab-content__form__soundcloud')
})