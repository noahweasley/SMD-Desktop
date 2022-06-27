"use-strict";

const State = Object.freeze({
  MAIN: "main-pane",
  SETTINGS: "settings-pane"
});

const Mode = Object.freeze({
  ALL: "All-download-data",
  SINGLE: "One-download-data",
  SELECT: "Some-download-data"
});

const Type = Object.freeze({
  DOWNLOADED: "Downloaded",
  DOWNLOADING: "Downloading",
  JOINED: "Join"
});

var WINDOW_CONTENT_STATE = State.MAIN;

window.addEventListener("DOMContentLoaded", () => {
  // retreive user downloads
  window.bridgeApis.invoke("get-list-data").then((data) => {
    // display data to user
    if ((data[0] && data[0].length > 0) || (data[1] && data[1].length > 0)) {
      populateList(data);
      // Now display the populated list items, becuase when they were created their visibility was set to gone.
      Array.from(document.getElementsByTagName("li")).forEach((listElement) => listElement.classList.remove("gone"));
    } else {
      displayDecors();
    }

    // display any indeterminate progress bar that exists inside main-pain's tab content
    document.querySelectorAll(".tab-content .indeterminate-progress").forEach((loader) => {
      if (loader.id != "window-data-loader") loader.classList.add("gone");
    });
  });

  // listen for event after populating the list
  registerEventListeners();
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

function displayDecorById(decorId) {
  const decor = document.getElementById(decorId);
  decor.style.setProperty("display", "flex");
}

function populateList(data) {
  data[0] ? createListItemDownloaded(data[0]) : displayDecorById("info_decor__downloaded");
  data[1] ? createListItemDownloading(data[1]) : displayDecorById("info_decor__downloading");

  // populate the 'downloaded' - list with item fetched from database
  function createListItemDownloaded(item) {
    const uLElement = document.querySelector(".list-group__downloaded");
    if (item.length > 0) uLElement.classList.remove("gone");
    // create the list items populating it with the fetched data from database
    for (let i = 0; i < item.length; i++) {
      const listElement = document.createElement("li");
      listElement.classList.add("list-group-item"); // create but don't display yet
      // create the thumbnail element
      const thumbnailElement = document.createElement("img");
      thumbnailElement.classList.add("media-object", "pull-left");
      thumbnailElement.setAttribute("src", "../assets/graphics/musical_2.png");
      // finally append those element node to the list parent node
      listElement.append(thumbnailElement);
      listElement.append(createMediaBody(i, item[i]));
      // append list item to list
      uLElement.append(listElement);
    }

    // creates a media body element
    function createMediaBody(position, item) {
      const mediaBody = document.createElement("div");
      mediaBody.className = "media-body";
      // create the track title
      const trackTitleElement = document.createElement("strong");
      trackTitleElement.innerText = `${position + 1}. ${item["Track_Title"]} - ${item["Track_Artists"]}`;
      // create the message element
      const messageElement = document.createElement("p");
      messageElement.innerText = item["Track_Download_Size"];
      messageElement.classList.add("message");
      // create the icons for the media body
      const opIconContainer1 = document.createElement("div");
      const opIconContainer2 = document.createElement("div");
      const opIconContainer3 = document.createElement("div");
      const opIcon1 = document.createElement("span");
      const opIcon2 = document.createElement("span");
      const opIcon3 = document.createElement("span");
      // ... classes
      opIconContainer1.classList.add("op-icon", "not-draggable", "pull-right");
      opIconContainer2.classList.add("op-icon", "not-draggable", "pull-right");
      opIconContainer3.classList.add("op-icon", "not-draggable", "pull-right");
      // ..
      opIcon1.classList.add("icon", "icon-folder", "icon-x2");
      opIcon2.classList.add("icon", "icon-trash", "icon-x2");
      opIcon3.classList.add("icon", "icon-play", "icon-x2");

      // navigate to file
      opIconContainer1.addEventListener("click", () => window.bridgeApis.send("navigate-link", "#music"));
      // delete local database entry and file on disk
      opIconContainer2.addEventListener("click", () => {
        let args = { data: item, type: Type.DOWNLOADED, mode: Mode.SINGLE };
        window.bridgeApis.invoke("delete-file", args).then((isFileDeleted) => {
          if (isFileDeleted) {
            let listItem = opIconContainer1.parentElement.parentElement;
            let listGroup = listItem.parentElement;

            listGroup.removeChild(listItem);
            if (listGroup.childNodes.length == 0) uLElement.classList.add("gone");
            displayDecorById("info_decor__downloaded");
          }
        });
      });

      opIconContainer3.addEventListener("click", () => window.bridgeApis.send("play-music", "default"));

      opIconContainer1.append(opIcon1);
      opIconContainer2.append(opIcon2);
      opIconContainer3.append(opIcon3);

      mediaBody.append(trackTitleElement);
      mediaBody.append(messageElement);
      mediaBody.append(opIconContainer1);
      mediaBody.append(opIconContainer2);
      mediaBody.append(opIconContainer3);

      return mediaBody;
    }
  }

  // populate the 'downloading' - list with item fetched from database
  function createListItemDownloading(item) {
    const uLElement = document.querySelector(".list-group__downloading");
    if (item.length > 0) uLElement.classList.remove("gone");
    // create the list items populating it with the fetched data from database
    for (let i = 0; i < item["length"]; i++) {
      const listElement = document.createElement("li");
      listElement.classList.add("list-group-item", "gone"); // create but don't display yet
      // create the thumbnail element
      const thumbnailElement = document.createElement("img");
      thumbnailElement.classList.add("media-object", "pull-left");
      thumbnailElement.setAttribute("src", "../assets/graphics/musical_2.png");
      // finally append those element node to the list parent node
      listElement.append(thumbnailElement);
      listElement.append(createMediaBody());
      // append list item to list
      uLElement.append(listElement);
    }

    // creates a media body element
    function createMediaBody(item) {
      const mediaBody = document.createElement("div");
      // create the track title
      const trackTitleElement = document.createElement("strong");
      trackTitleElement.innerText = item["trackTitle"];
      // create the message element
      const messageElement = document.createElement("p");
      messageElement.innerText = item["message"];
      messageElement.classList.add("message");
      // create the icons for the media body
      const opIconContainer = document.createElement("div");
      const opIcon = document.createElement("span");
      // ... classes
      opIcon.classList.add("icon", "icon-pause", "icon-x2");
      opIconContainer.classList.add("op-icon", "not-draggable", "pull-right");
      opIconContainer.append(opIcon);
      // create the progress bar element
      const downloadProgressElement = document.createElement("div");
      downloadProgressElement.classList.add("horizontal-progress");
      downloadProgressElement.id = `download-progress${item["listPos"]}`;
      // finally append the created element nodes as children to the parent media body node
      mediaBody.append(trackTitleElement);
      mediaBody.append(messageElement);
      mediaBody.append(opIconContainer);
      mediaBody.append(downloadProgressElement);

      return mediaBody;
    }
  }
}

// Register all event listeners on the list section UI in here
function registerEventListeners() {
  let navItems = document.querySelectorAll(".nav-group-item");
  const settingsPane = document.querySelector(".pane-settings");
  const mainPane = document.querySelector(".pane-main");

  navItems.forEach((navItem) => {
    const navItemChildren = Array.from(navItem.parentElement.children);

    navItem.addEventListener("click", (_event) => {
      // dont change active state of the nav item that have the 'click' class as attribute
      if (navItemChildren.indexOf(navItem) === 1 || navItemChildren.indexOf(navItem) === navItemChildren.length - 2) {
        return;
      }
      // remove nav-item active state
      for (x = 0; x < navItems.length; x++) {
        navItems[x].classList.remove("active");
      }
      navItem.classList.add("active");

      // toggle main and settings pane's visibility
      if (WINDOW_CONTENT_STATE != State.MAIN && navItemChildren.indexOf(navItem) == 0) {
        mainPane.classList.remove("gone");
        settingsPane.classList.add("gone");
        WINDOW_CONTENT_STATE = State.MAIN;
      } else if (
        WINDOW_CONTENT_STATE != State.SETTINGS &&
        navItemChildren.indexOf(navItem) === navItemChildren.length - 3
      ) {
        mainPane.classList.add("gone");
        settingsPane.classList.remove("gone");
        WINDOW_CONTENT_STATE = State.SETTINGS;
      }
    });
  });

  // fallback image on thumnail load error
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
