'use-strict'

window.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("settings-loader");
  const settingsList = document.querySelector(".pane-settings .list-group");

  window.bridgeApis.invoke("get-states", ["secrets-received", "false"]).then((_value) => {
    setTimeout(() => {
      loader.classList.add("gone");
      settingsList.classList.remove("gone");
    }, 3000);
  });
});
