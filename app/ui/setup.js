'use-strict'

function dataReveal() {
    const windowContent = document.querySelector('.window')
    const modal = document.querySelector('.modal')
    const titileBar = document.querySelector('.toolbar-header')
    titileBar.classList.remove('gone')

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

window.addEventListener('DOMContentLoaded', () => {
    // 3 seconds time delay before displaying contents to user ...
    setTimeout(dataReveal, 3000)

})