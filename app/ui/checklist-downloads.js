window.addEventListener("DOMContentLoaded", () => {
  setTimeout(dataReveal, 3000);
  const selectAll = document.getElementById("select-all");
  const select = document.querySelectorAll(".cbx-select");
  selectAll.addEventListener("click", () => selectAllDownloads(selectAll.checked, select));
});

function dataReveal() {
  const buttons = document.querySelectorAll(".btn");
  const inderminateProgres = document.querySelector(".indeterminate-progress");
  buttons.forEach((button) => button.removeAttribute("disabled"));
  const list = document.querySelector(".list");
  inderminateProgres.classList.add("gone");
  list.classList.remove("gone");
}

function selectAllDownloads(sa_IsChecked, select) {
  select.forEach((cbx) => (cbx.checked = sa_IsChecked));
}
