window.addEventListener("DOMContentLoaded", () => {
  // deactive link default actions
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      let li = link.getAttribute("href");
      window.bridgeApis.send("navigate-link", li);
    });
  });

  const header = document.getElementById("app-name");
  const names = document.querySelectorAll(".name");
  const inderminateProgres = document.querySelector(".indeterminate-progress");
  const windowContent = document.getElementById("content");

  window.bridgeApis.invoke("app-details").then((content) => {
    header.innerText = `${content[0]} - version - ${content[1]}`;
    names.forEach((name) => {
      name.innerText = content[0];
    });

    inderminateProgres.classList.add("gone");
    windowContent.classList.remove("gone");
  });
});
