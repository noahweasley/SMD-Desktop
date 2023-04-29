window.addEventListener("DOMContentLoaded", () => {
  const spcid = document.getElementById("spcid");
  const spcs = document.getElementById("spcs");
  const ytak = document.getElementById("ytak");
  const searchInput = document.getElementById("input-search");
  const searchButton = document.querySelector(".btn-search");
  let isSearchInputFocused = false;

  // active link default actions
  document.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const li = link.getAttribute("href");
      window.bridgeApis.send("navigate-link", li);
    });
  });

  // window action button clicked
  document.querySelectorAll(".window-action").forEach((action) => {
    action.addEventListener("click", () => {
      window.bridgeApis.send("action-click-event", action.id);
    });
  });

  document.getElementById("about").addEventListener("click", () => {
    window.bridgeApis.send("show-app-info");
  });

  document.getElementById("files").addEventListener("click", (event) => {
    event.preventDefault();
    window.bridgeApis.send("navigate-link", "#music");
  });

  // donate button click. Navigate to sponsorship page
  document.querySelector(".donate").addEventListener("click", () => {
    window.bridgeApis.send("navigate-link", "https://www.patreon.com/noahweasley");
  });

  // Paste URL button click
  document.querySelector(".paste").addEventListener("click", () => {
    window.bridgeApis.invoke("clipboard-request").then((content) => {
      if (content === "track") {
        // search for tracks to download
        window.bridgeApis.send("show-search-download-window", {
          type: "track",
          description: undefined
        });
      } else if (content === "playlist" || content === "album" || content === "artist") {
        window.bridgeApis.send("show-download-window");
      } else {
        // no-op; some errors were not handled
        if (content === "Unknown") {
          window.bridgeApis.send("show-error-unknown-dialog", {
            title: "Unsupported Spotify URL link",
            message: "Please be patient, we will implement this in the future"
          });
        }
      }
    });
  });

  searchInput.addEventListener("focus", () => (isSearchInputFocused = true));
  searchInput.addEventListener("blur", () => (isSearchInputFocused = false));

  // on enter key pressed, perform search
  document.addEventListener(
    "keypress",
    (event) => isSearchInputFocused && searchInput.value && event.key === "Enter" && searchButton.click()
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

  document.querySelectorAll(".btn-form").forEach((auth) => {
    auth.addEventListener("click", () => {
      let data;

      switch (auth.id) {
        case "auth-spotify":
          data = [spcid.value, spcs.value];
          break;
        case "auth-youtube":
          data = [ytak.value];
          break;
      }

      // if text areas are empty, don't try to authorize values
      if (auth.id === "auth-spotify" && spcid.value === "" && spcs.value === "") {
        spcid.setAttribute("placeholder", "Client ID can't be empty");
        spcs.setAttribute("placeholder", "Client Secret can't be empty");
        return;
      } else if (auth.id === "auth-spotify" && spcid.value === "") {
        return spcid.setAttribute("placeholder", "Client ID can't be empty");
      } else if (auth.id === "auth-spotify" && spcs.value === "") {
        return spcs.setAttribute("placeholder", "Client Secret can't be empty");
      } else if (auth.id === "auth-youtube" && ytak.value === "") {
        return ytak.setAttribute("placeholder", "API Key can't be empty");
      } else {
        // authorize application with parameters provided by user
        data.push(auth.id);
        window.bridgeApis.invoke("authorize-app", data).then((result) => {
          if (result && auth.id === "auth-youtube") {
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
          // switchAuthorizationTabs(auth.id);
        });
      }
    });
  });
});

// eslint-disable-next-line no-unused-vars
function switchAuthorizationTabs(authId) {
  const authTabContent1 = document.getElementById("tab-content__form__spotify");
  const authTabContent2 = document.getElementById("tab-content__form__youtube");
  const authTabItems = document.querySelectorAll(".tab-item__form");

  if (authId === "auth-spotify") {
    // if secrets are received, reload page, if not, switch to spotify authorization tab
    window.bridgeApis.invoke("get-multiple-states", ["spotify-secrets-received", "yt-api-key-received"]).then((value) => {
      if (value[0] === "true") {
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
      if (value[0] === "true" && value[1] === "true") {
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
