window.addEventListener("DOMContentLoaded", () => {
  const selectAll = document.getElementById("select-all");
  const select = document.querySelectorAll(".cbx-select");
  const buttons = document.querySelectorAll(".btn");
  const retryButton = document.getElementById("retry");
  
  retryButton.addEventListener("click", () => {
    resetViewState();
    window.bridgeApis.invoke("download-data").then((content) => {
      setTimeout(() => dataReveal(buttons), 3000);
    });
  });

  selectAll.addEventListener("click", () => selectAllDownloads(selectAll.checked, select));
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      window.bridgeApis.send("download-click-event", button.id);
    });
  });
  
  setTimeout(() => dataReveal(buttons), 3000);
});


function resetViewState() {
  const loader = document.querySelector(".loader");
  const buttons = document.querySelectorAll(".btn");
  const errorDecoration = document.querySelector(".error-decor");
  
  errorDecoration.style.setProperty("display", "none");
  loader.classList.remove("gone");
  buttons.forEach((button) => button.setAttribute("disabled", true));  
}

function dataReveal(buttons) {
  const loader = document.querySelector(".loader");
  const errorDecoration = document.querySelector(".error-decor");
  
  buttons.forEach((button) => button.removeAttribute("disabled"));
  const list = document.querySelector(".list");

  window.bridgeApis.invoke("download-data").then((content) => {
    loader.classList.add("gone");
    if (content) {
      list.classList.remove("gone");
      errorDecoration.style.setProperty("display", "none");
    } else {
      errorDecoration.style.setProperty("display", "flex");
    }
  });
}

function selectAllDownloads(sa_IsChecked, select) {
  select.forEach((cbx) => (cbx.checked = sa_IsChecked));
}
