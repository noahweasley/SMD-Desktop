window.addEventListener("DOMContentLoaded", () => {
  let SELECTED_POS = [];
  let listData;
  //...
  const selectAll = document.getElementById("select-all");
  const select = document.querySelectorAll(".cbx-select");
  const buttons = document.querySelectorAll(".btn");
  const retryButton = document.getElementById("retry");
  const message = document.querySelector(".message");

  selectAll.addEventListener("click", () => selectAllDownloads(selectAll.checked, select));

  select.forEach((s_cbx) => {
    s_cbx.addEventListener("click", () => {
      SELECTED_POS[Array.from(select).indexOf(s_cbx)] = s_cbx.checked;
    });
  });

  retryButton.addEventListener("click", () => {
    resetViewState();
    setTimeout(() => dataReveal(buttons), 3000);
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      window.bridgeApis.send("download-click-event", button.id, listData);
    });
  });

  setTimeout(dataReveal, 3000); // removes glitches in UI, but I have no idea why it does that

  function selectAllDownloads(sa_IsChecked, select) {
    // select.forEach((cbx) => (cbx.checked = sa_IsChecked));
    for (let x = 0; x < select.length; x++) {
      SELECTED_POS[x] = sa_IsChecked;
      cbx.checked = sa_IsChecked;
    }
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

    const list = document.querySelector(".list");

    window.bridgeApis.invoke("download-data").then((data) => {
      loader.classList.add("gone");
      if (!data instanceof String) {
        displayDataOnList(data, list);
        list.classList.remove("gone");
        errorDecoration.style.setProperty("display", "none");
        buttons.forEach((button) => button.removeAttribute("disabled"));
      } else {
        list.classList.add("gone");
        errorDecoration.style.setProperty("display", "flex");
        message.innerText = data;
        buttons[0].removeAttribute("disabled");
      }
    });
  }

  function displayDataOnList(data, list) {
    listData = data;
  }

  // end DOMContentLoaded callbck
});
