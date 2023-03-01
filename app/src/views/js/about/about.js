window.addEventListener("DOMContentLoaded", () => {
  // deactivate link default actions
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const li = link.getAttribute("href");
      window.bridgeApis.send("navigate-link", li);
    });
  });

  const header = document.getElementById("app-name");
  const names = document.querySelectorAll(".name");
  const indeterminateProgress = document.querySelector(".indeterminate-progress");
  const windowContent = document.getElementById("content");

  window.bridgeApis.invoke("app-details").then((content) => {
    header.innerHTML = `${content[0]}&nbsp&nbsp - &nbsp version ${content[1]}`;
    names.forEach((name) => (name.innerText = content[0]));

    indeterminateProgress.classList.add("gone");
    windowContent.classList.remove("gone");
  });
});
