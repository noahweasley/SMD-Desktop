"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  registerEventListeners();
  // retreive user downloads
  window.bridgeApis.invoke("get-list-data").then((data) => {
    let loaders = document.querySelectorAll(".indeterminate-progress");

    loaders.forEach((loader) => {
      if (loader.id != "window-data-loader") loader.classList.add("gone");
    });
    // display data to user
    if (data) {
      populateList(data);
    } else {
      displayDecors();
    }
  });

  // actions related to file downloads
  window.bridgeApis.on("download-progress-update", (_event, args) => {
    let [listPos, progress] = args;
    setDownloadProgress(listPos, progress);
  });
});

function displayDecors() {
  const decors = document.querySelectorAll(".info-decor");
  decors.forEach((decor) => decor.style.setProperty("display", "flex"));
}

function populateList(data) {
  const listDownloads = document.getElementById("tab-content__downloaded");
  const listDownloading = document.getElementById("tab-content__downloading");
  listDownloads.append(createListItemDownloads(data[0]));
  listDownloading.append(createListItemDownloading(data[1]));

  function createListItemDownloads(item) {
    return null;
  }

  function createListItemDownloading(item) {
    return null;
  }
}

function registerEventListeners() {
  let navItems = document.querySelectorAll(".nav-group-item");

  navItems.forEach((navItem) => {
    const navItemChildren = Array.from(navItem.parentElement.children);

    navItem.addEventListener("click", (_event) => {
      // dont change active state of the nav item that have the 'click' class as attribute
      if (navItemChildren.indexOf(navItem) === 1 || navItemChildren.indexOf(navItem) === navItemChildren.length - 2) {
        return;
      }
      // remove nav-item acive state
      for (x = 0; x < navItems.length; x++) {
        navItems[x].classList.remove("active");
      }
      navItem.classList.add("active");
    });
  });

  // ...
  document.querySelectorAll(".media-object").forEach((m) => {
    m.addEventListener("error", () => m.setAttribute("src", "../assets/graphics/musical.png"));
  });
}

// actions related to file downloads

function setProgress(elementId, prog) {
  const progress = document.getElementById(elementId);
  progress.style.setProperty("--progress-width", prog);
  progress.style.setProperty("--progress-anim", "none");
}

function setDownloadProgress(listPos, progress) {}

function dummyAnimate(listPos) {
  let progress = 0;
  setTimeout(() => {
    setInterval(() => {
      setProgress(
        `download-progress-${listPos}`,
        `${(progress = progress === 100 ? (progress = 0) : (progress += 2))}%`
      );
    }, 1000);
  }, 10000);
}
