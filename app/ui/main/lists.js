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
      // dont change active state of the file nav item
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
