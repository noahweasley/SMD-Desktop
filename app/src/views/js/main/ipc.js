"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  // active link default actions
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

  document.getElementById("about").addEventListener("click", (_event) => {
    window.bridgeApis.send("show-app-info");
  });

  document.getElementById("files").addEventListener("click", (event) => {
    event.preventDefault();
    window.bridgeApis.send("navigate-link", "#music");
  });

  // donate button click. Navigate to sponsorship page
  document.querySelector(".donate").addEventListener("click", (_event) => {
    window.bridgeApis.send("navigate-link", "https://www.buymeacoffee.com/noahweasley");
  });

  // Paste URL button click
  document.querySelector(".paste").addEventListener("click", () => {
    window.bridgeApis.invoke("clipboard-request").then((content) => {
      if (content == "track") {
        // search for tracks to download
        window.bridgeApis.send("show-search-download-window", {
          type: "track",
          description: undefined
        });
      } else if (content == "playlist" || content == "album" || content == "artist") {
        window.bridgeApis.send("show-download-window");
      } else {
        // no-op; some errors were not handled
        //? next line was commented-out because somehow a bug was fixed and I don't know how
        if (content === "Unknown") {
          window.bridgeApis.send("show-error-unknown-dialog", {
            title: "Unsupported Spotify URL link",
            message: "Please be patient, we will implement this in the future"
          });
        }
      }
    });
  });

  const searchInput = document.getElementById("input-search");
  const searchButton = document.querySelector(".btn-search");
  let isFocused = false;

  searchInput.addEventListener("focus", () => (isFocused = true));
  searchInput.addEventListener("blur", () => (isFocused = false));

  // on enter key pressed, perform search
  document.addEventListener(
    "keypress",
    (event) => isFocused && searchInput.value && event.key == "Enter" && searchButton.click()
  );

  // search button click
  searchButton.addEventListener("click", () => {
    if (!searchInput.value) return searchInput.setAttribute("placeholder", "Field can't be empty");

    // Wrap searchQuery in object array, to be compatible with the other kind of search query
    window.bridgeApis.send("show-search-download-window", {
      type: "search",
      value: searchInput.value
    });
  });

  // request app details; but use only the first content in the array returned,
  // which returns the app name
  window.bridgeApis.invoke("app-details").then((content) => {
    const names = document.querySelectorAll(".name");
    names.forEach((name) => (name.innerText = content[0]));
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
    window.bridgeApis.invoke("get-multiple-states", ["spotify-secrets-received", "yt-api-key-received"]).then((value) => {
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
    window.bridgeApis.invoke("get-multiple-states", ["spotify-secrets-received", "yt-api-key-received"]).then((value) => {
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
