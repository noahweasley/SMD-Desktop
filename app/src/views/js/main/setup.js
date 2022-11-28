"use-strict";

function dataReveal() {
  const windowContent = document.querySelector(".window");
  const loader = document.getElementById("window-data-loader");
  const modal = document.querySelector(".modal");
  const titleBar = document.querySelector(".toolbar-header");
  titleBar.classList.remove("gone");

  window.bridgeApis.invoke("get-multiple-states", ["spotify-secrets-received", "yt-api-key-received"]).then((value) => {
    loader.classList.add("gone");
    if (value[0] === "true") {
      windowContent.classList.remove("gone");
      modal.style.setProperty("display", "none");
    } else {
      modal.style.setProperty("display", "flex");
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  // 3 seconds time delay before displaying contents to user
  setTimeout(dataReveal, 3000);

  window.bridgeApis.invoke("app-details").then((content) => {
    const title = document.querySelector(".title");
    title.innerText = content[0];
  });
});
