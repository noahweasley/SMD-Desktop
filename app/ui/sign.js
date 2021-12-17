'use-strict'

module.exports.createLoginScreen = function () {
    const loginScreen = document.createElement('div')
    loginScreen.classList.add(["modal", "login"])

    return loginScreen
}