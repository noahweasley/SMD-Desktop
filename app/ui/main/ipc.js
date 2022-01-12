"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  const about = document.getElementById("about");
  about.addEventListener("click", (_event) => {
    window.bridgeApis.send("show-app-info");
  });
  // deactive link default actions
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      let li = link.getAttribute("href");
      window.bridgeApis.send("navigate-link", li);
    });
  });

  // window action button clicked
  document.querySelectorAll(".window-action").forEach((action) => {
    action.addEventListener("click", (_event) => {
      window.bridgeApis.send("action-click-event", action.id);
    });
  });

  //...
  document.querySelector(".donate").addEventListener("click", (_event) => {
    window.bridgeApis.send("navigate-link", "https://www.buymeacoffee.com/noahweasley");
  });

  // ...
  document.querySelector(".paste").addEventListener("click", () => {
    window.bridgeApis.invoke("clipboard-request").then((content) => {
      if (content == "track") {
        // download immediately
        window.bridgeApis.send("begin-download");
      } else {
        // a funny eror message would be emitted to the renderer process, hence the 'Uh'
        if (content.startsWith("Uh")) return;
        window.bridgeApis.send("show-download-list");
      }
    });
  });

  window.bridgeApis.invoke("app-details").then((content) => {
    const names = document.querySelectorAll(".name");
    names.forEach((name) => {
      name.innerText = content[0];
    });
  });

  // ..
  const s = document.getElementById("spcid");
  const s1 = document.getElementById("spcs");
  const s2 = document.getElementById("socid");

  document.querySelectorAll(".btn-form").forEach((auth) => {
    auth.addEventListener("click", () => {
      let data;

      switch (auth.id) {
        case "auth-spotify":
          data = [s.value, s1.value];
          break;
        case "auth-soundcloud":
          data = [s2.value];
          break;
      }

      data.push(auth.id);
      window.bridgeApis.invoke("authorize-app", data).then((result) => {
        if (result && auth.id == "auth-soundcloud") {
          auth.innerText = "Saved";
          // <span class="icon icon-check"></span>
          const icon = document.createElement("span");
          icon.classList.add("icon", "icon-check");
          auth.appendChild(icon);
        } else {
          // disable button and enable it only when the server timeout has reached
          auth.setAttribute("disabled", "true");
          setTimeout(() => auth.removeAttribute("disabled"), 30000);
        }
      });
    });
  });
});
