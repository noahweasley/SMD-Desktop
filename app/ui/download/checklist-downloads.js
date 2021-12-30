window.addEventListener("DOMContentLoaded", () => {
  //...
  const selectAll = document.getElementById("select-all");
  const select = document.querySelectorAll(".cbx-select");
  const buttons = document.querySelectorAll(".btn");
  const retryButton = document.getElementById("retry");
  const message = document.querySelector(".message");

  retryButton.addEventListener("click", () => {
    resetViewState();
    setTimeout(() => dataReveal(buttons), 3000);
  });

  selectAll.addEventListener("click", () => selectAllDownloads(selectAll.checked, select));
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      window.bridgeApis.send("download-click-event", button.id);
    });
  });

  setTimeout(dataReveal, 3000); // removes glitches in UI, but I have no idea why it does that

  function selectAllDownloads(sa_IsChecked, select) {
    select.forEach((cbx) => (cbx.checked = sa_IsChecked));
  }

  function resetViewState() {
    const loader = document.querySelector(".loader");
    const errorDecoration = document.querySelector(".error-decor");

    errorDecoration.style.setProperty("display", "none");
    loader.classList.remove("gone");
    buttons.forEach((button) => button.setAttribute("disabled", true));
  }

  function dataReveal() {
    const loader = document.querySelector(".loader");
    const errorDecoration = document.querySelector(".error-decor");

    buttons.forEach((button) => button.removeAttribute("disabled"));
    const list = document.querySelector(".list");

    window.bridgeApis
      .invoke("download-data")
      .then((data) => {
        loader.classList.add("gone");
        if (!data instanceof String) {
          displayDataOnList(data, list);
          list.classList.remove("gone");
          errorDecoration.style.setProperty("display", "none");
        } else {
          list.classList.add("gone");
          errorDecoration.style.setProperty("display", "flex");
          message.innerText = data;
        }
      })
  }

  function displayDataOnList(data, list) {}

  // end DOMContentLoaded callbck
});
