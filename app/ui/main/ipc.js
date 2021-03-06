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
        // search for tracks to download
        window.bridgeApis.send("show-search-download-window");
      } else {
        // a funny eror message would be emitted to the renderer process, hence the 'Uh'
        if (content.startsWith("Uh")) return;
        window.bridgeApis.send("show-download-window");
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
  const s2 = document.getElementById("ytak");

  document.querySelectorAll(".btn-form").forEach((auth) => {
    auth.addEventListener("click", () => {
      let data;

      switch (auth.id) {
        case "auth-spotify":
          data = [s.value, s1.value];
          break;
        case "auth-youtube":
          data = [s2.value];
          break;
      }

      // if text areas are empty, don't try to authorize values
      if (auth.id == "auth-spotify" && s.value == "" && s1.value == "") {
        s.setAttribute("placeholder", "Client ID can't be empty");
        s1.setAttribute("placeholder", "Client Secret can't be empty");
        return;
      } else if (auth.id == "auth-spotify" && s.value == "") {
        return s.setAttribute("placeholder", "Client ID can't be empty");
      } else if (auth.id == "auth-spotify" && s1.value == "") {
        return s1.setAttribute("placeholder", "Client Secret can't be empty");
      } else if (auth.id == "auth-youtube" && s2.value == "") {
        return s2.setAttribute("placeholder", "API Key can't be empty");
      } else {
        // authorize application with parameters provided by user
        data.push(auth.id);
        window.bridgeApis.invoke("authorize-app", data).then((result) => {
          if (result && auth.id == "auth-youtube") {
            auth.innerText = "Saved";
            // <span class="icon icon-check"></span>
            const icon = document.createElement("span");
            icon.classList.add("icon", "icon-check");
            auth.appendChild(icon);
          } else {
            // disable button and enable it only when the server timeout has reached
            auth.setAttribute("disabled", "true");
            auth.innerText = "Authorizing, please wait...";
            setTimeout(() => {
              auth.innerText = "Authorize";
              auth.removeAttribute("disabled");
            }, 30000);
          }

          switchAuthorizationTabs(auth.id);
        });
      }
    });
  });
});

function switchAuthorizationTabs(authId) {
  const authTabContent1 = document.getElementById("tab-content__form__spotify");
  const authTabContent2 = document.getElementById("tab-content__form__youtube");
  const authTabItems = document.querySelectorAll(".tab-item__form");

  if (authId == "auth-spotify") {
    // if secrets are received, reload page, if not, switch to spotify authorization tab
    window.bridgeApis
      .invoke("get-multiple-states", ["spotify-secrets-received", "yt-api-key-received"])
      .then((value) => {
        if (value[0] == "true") {
          window.bridgeApis.send("reload-current-window");
        } else {
          authTabContent1.classList.add("invisible");
          authTabContent2.classList.remove("invisible");
          authTabItems[0].classList.remove("active");
          authTabItems[1].classList.add("active");
        }
      });
  } else {
    // if secrets are received, reload page, if not, switch to spotify authorization tab
    window.bridgeApis
      .invoke("get-multiple-states", ["spotify-secrets-received", "yt-api-key-received"])
      .then((value) => {
        if (value[0] == "true" && value[1] == "true") {
          window.bridgeApis.send("reload-current-window");
        } else {
          authTabContent2.classList.add("invisible");
          authTabContent1.classList.remove("invisible");
          authTabItems[1].classList.remove("active");
          authTabItems[0].classList.add("active");
        }
      });
  }
}
