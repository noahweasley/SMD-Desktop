'use-strict'

window.addEventListener('DOMContentLoaded', () => {
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
})