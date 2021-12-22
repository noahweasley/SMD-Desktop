"use-strict";

function dataReveal() {
  const windowContent = document.querySelector(".window");
  const inderminateProgres = document.querySelector(".indeterminate-progress");
  const modal = document.querySelector(".modal");
  const titileBar = document.querySelector(".toolbar-header");
  titileBar.classList.remove("gone");

  window.bridgeApis.invoke("get-states", ["secrets-received", "false"]).then((value) => {
    window.bridgeApis.send("start-token-refresh");
    inderminateProgres.classList.add("gone");
    if (value == "true") {
      windowContent.classList.remove("gone");
      modal.style.setProperty("display", "none");
    } else {
      modal.style.setProperty("display", "flex");
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  // 3 seconds time delay before displaying contents to user ...
  setTimeout(dataReveal, 3000);
  
  // check online status
  const onlineStat = document.querySelector('.online-stat')
  setInterval(() => {
    let online = window.navigator.onLine;
    if (online) onlineStat.classList.add("online");
    else onlineStat.classList.remove("online");
  }, 2000);
});
