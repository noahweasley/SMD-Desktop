"use-strict";

function dataReveal() {
  const windowContent = document.querySelector(".window");
  const modal = document.querySelector(".modal");
  const titileBar = document.querySelector(".toolbar-header");
  titileBar.classList.remove("gone");

  window.bridgeApis.invoke("get-states", ["secrets-received", "false"]).then((value) => {
    window.bridgeApis.send("start-token-refresh");
    if (value == "true") {
      windowContent.classList.remove("gone");
      modal.style.setProperty("display", "none");
    } else {
      modal.style.setProperty("display", "flex");
    }
  });

  // window.bridgeApis.invoke('set-states', ['data3', `Created at: ${Date.now()}`])
  //     .then(result => {
  //         console.log(result)
  //     })
}

window.addEventListener("DOMContentLoaded", () => {
  // 3 seconds time delay before displaying contents to user ...
  setTimeout(dataReveal, 3000);
});
