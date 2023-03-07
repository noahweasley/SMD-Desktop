/* eslint-disable no-undef */
"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  let WINDOW_CONTENT_STATE = State.MAIN;
  const listData = [];

  // retrieve user downloads
  window.bridgeApis.invoke("get-list-data").then((listData) => {
    const downloadedData = listData[0];
    const downloadingData = listData[1];
    const hasDownloadedData = listData && downloadedData && downloadedData.length > 0;
    const hasDownloadingData = listData && downloadingData && downloadingData.length > 0;

    if (hasDownloadedData || hasDownloadingData) {
      tryAddListItemDownloaded(downloadedData);
      tryAddListItemDownloading(downloadingData);
      // Now display the populated list items
      Array.from(document.getElementsByTagName("li")).forEach((listElement) => listElement.classList.remove("gone"));
    } else {
      displayAllDecorations(true);
    }

    // display any indeterminate progress bar that exists inside main-pain's tab content
    document.querySelectorAll(".tab-content .indeterminate-progress").forEach((loader) => {
      if (loader.id != "window-data-loader") loader.classList.add("gone");
    });
  });

  // listen for event after populating the list
  registerEventListeners();
  // actions related to file downloads
  window.bridgeApis.on("download-progress-update", displayProgress);
  window.bridgeApis.on("download-progress-finished", displayProgress);

  window.bridgeApis.on("download-list-update", (_event, args) => {
    // append new data into current data
    tryAddListItemDownloading(args, true);
    displayEmptyListPlaceholderById("info_decor__downloaded", false);
    registerEventListeners();
    // after changing UI states, start file downloads
    window.bridgeApis.send("initiate-downloads");
  });

  function displayAllDecorations(shouldShow) {
    const infoDecorations = document.querySelectorAll(".info-decor");

    infoDecorations.forEach((infoDecoration) =>
      shouldShow ? infoDecoration.style.setProperty("display", "flex") : infoDecoration.style.setProperty("display", "none")
    );
  }

  function displayEmptyListPlaceholderById(decorationId, shouldShow) {
    const decoration = document.getElementById(decorationId);
    if (shouldShow) {
      decoration.style.setProperty("display", "flex");
    } else {
      // remove .gone class if it is present
      decoration.classList.remove("gone");
      decoration.style.setProperty("display", "none");
    }
  }

  // populate the 'downloading' - list with item fetched from database
  function tryAddListItemDownloading(item, shouldAppend) {
    const uLElement = document.querySelector(".list-group__downloading");

    if (!item) {
      uLElement.classList.add("gone");
      displayEmptyListPlaceholderById("info_decor__downloading", true);
    } else {
      uLElement.classList.remove("gone");
      displayEmptyListPlaceholderById("info_decor__downloading", false);

      // TODO: fix duplicate code introduced while trying to fix bug in 'add to downloading list'
      if (shouldAppend) {
        // TODO: make listData.length return the previous size instead of 0 and use position on list
        const oldDataSize = listData.length;
        const newDataSize = oldDataSize + item.length;
        // create list, append data
        for (let position = oldDataSize; position < newDataSize; position++) {
          uLElement.append(createListItem(position, item));
        }
      } else {
        // create list, don't care to append
        for (let position = 0; position < item.length; position++) {
          uLElement.append(createListItem(position, item));
        }
      }
    }

    function createListItem(position, item) {
      const dbData = item[position];
      const itemId = dbData.id;

      const listElement = document.createElement("li");
      listElement.classList.add("list-group-item", "gone"); // create but don't display yet
      // create the thumbnail element
      const thumbnailElement = document.createElement("img");
      thumbnailElement.classList.add("media-object", "pull-left");
      thumbnailElement.setAttribute("src", "app/../../../../resources/images/musical_2.png");
      // finally append those element node to the list parent node
      listElement.append(thumbnailElement);
      listElement.append(createMediaBody(itemId, dbData));
      listElement.classList.remove("gone");
      return listElement;
    }

    // creates a media body element
    function createMediaBody(itemId, dbData) {
      const mediaBody = document.createElement("div");
      mediaBody.className = "media-body";
      // create the track title
      const trackTitleElement = document.createElement("strong");
      trackTitleElement.innerHTML = `${dbData["TrackTitle"]}`;
      // create the message element
      const messageElement = document.createElement("p");
      messageElement.innerText = dbData["Message"];
      messageElement.classList.add("message");
      // create the icons for the media body
      const opIconContainer = document.createElement("div");
      const opIconContainer2 = document.createElement("div");

      const opIcon = document.createElement("span");
      const opIcon2 = document.createElement("span");

      opIconContainer.classList.add("op-icon", "not-draggable", "pull-right");
      opIconContainer2.classList.add("op-icon", "not-draggable", "pull-right");

      opIcon.classList.add("icon", "icon-pause", "icon-x2");
      opIcon2.classList.add("icon", "icon-cancel", "icon-x2");

      opIconContainer.append(opIcon);
      opIconContainer2.append(opIcon2);

      // create the progress bar element
      const downloadProgressElement = document.createElement("div");
      downloadProgressElement.classList.add("horizontal-progress");
      downloadProgressElement.id = `download-progress-${itemId}`;
      const loadingIndicatorElement = document.createElement("div");
      loadingIndicatorElement.classList.add("load-indicator");
      downloadProgressElement.append(loadingIndicatorElement);
      // finally append the created element nodes as children to the parent media body node
      mediaBody.append(trackTitleElement);
      mediaBody.append(messageElement);
      mediaBody.append(opIconContainer);
      mediaBody.append(opIconContainer2);
      mediaBody.append(downloadProgressElement);

      return mediaBody;
    }
  }

  function tryAddListItemDownloaded(item, appendOnly) {
    const uLElement = document.querySelector(".list-group__downloaded");

    if (appendOnly && item) {
      appendListData();
    } else {
      if (!item) {
        uLElement.classList.add("gone");
        displayEmptyListPlaceholderById("info_decor__downloaded", true);
      } else {
        displayEmptyListPlaceholderById("info_decor__downloaded", false);
        if (item.length > 0) uLElement.classList.remove("gone");
        appendListData();
      }
    }

    function appendListData() {
      for (let i = 0; i < item.length; i++) {
        const listElement = document.createElement("li");
        listElement.classList.add("list-group-item"); // create but don't display yet

        // create the thumbnail element
        const thumbnailElement = document.createElement("img");
        thumbnailElement.classList.add("media-object", "pull-left");
        thumbnailElement.setAttribute("src", "app/../../../../resources/images/musical_2.png");
        // finally append those element node to the list parent node
        listElement.append(thumbnailElement);
        listElement.append(createMediaBody(uLElement.children.length, item[i]));
        // append list item to list
        uLElement.append(listElement);
      }
    }

    // creates a media body element
    function createMediaBody(position, item) {
      const mediaBody = document.createElement("div");
      mediaBody.className = "media-body";
      // create the track title
      const trackTitleElement = document.createElement("strong");
      trackTitleElement.innerText = `${position + 1}. ${item["TrackTitle"]}`;
      // create the message element
      const messageElement = document.createElement("p");
      messageElement.innerText = item["TrackDownloadSize"];
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
        const args = { data: item, type: Type.DOWNLOADED };

        window.bridgeApis.invoke("delete-file", args).then((isFileDeleted) => {
          if (isFileDeleted) {
            const listItem = opIconContainer1.parentElement.parentElement;
            const listGroup = listItem.parentElement;

            listGroup.removeChild(listItem);
            if (listGroup.childNodes.length == 0) uLElement.classList.add("gone");
            displayEmptyListPlaceholderById("info_decor__downloaded", true);
          }
        });
      });

      opIconContainer3.addEventListener("click", () => window.bridgeApis.send("play-music", item["TrackUri"]));

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

  // Register all event listeners on the list section UI in here
  function registerEventListeners() {
    const navItems = document.querySelectorAll(".nav-group-item");
    const settingsPane = document.querySelector(".pane-settings");
    const mainPane = document.querySelector(".pane-main");

    navItems.forEach((navItem) => {
      const navItemChildren = Array.from(navItem.parentElement.children);

      navItem.addEventListener("click", () => {
        // don't change active state of the nav item that have the 'click' class as attribute
        const homeNavItemIndex = 0;
        const filesNavItemIndex = 1;
        const aboutNavItemIndex = navItemChildren.length - 2;
        const settingsNavItemIndex = navItemChildren.length - 3;
        const isHomeNavItemIndex = navItemChildren.indexOf(navItem) == homeNavItemIndex;
        const isFilesNavItemIndex = navItemChildren.indexOf(navItem) === filesNavItemIndex;
        const isAboutNavItemIndex = navItemChildren.indexOf(navItem) === aboutNavItemIndex;
        const isSettingsNavItemIndex = navItemChildren.indexOf(navItem) === settingsNavItemIndex;

        if (isFilesNavItemIndex || isAboutNavItemIndex) return;
        navItems.forEach((navItem) => navItem.classList.remove("active"));
        navItem.classList.add("active");

        // toggle main and settings pane's visibility
        if (WINDOW_CONTENT_STATE != State.MAIN && isHomeNavItemIndex) {
          mainPane.classList.remove("gone");
          settingsPane.classList.add("gone");
          WINDOW_CONTENT_STATE = State.MAIN;
        } else if (WINDOW_CONTENT_STATE != State.SETTINGS && isSettingsNavItemIndex) {
          mainPane.classList.add("gone");
          settingsPane.classList.remove("gone");
          WINDOW_CONTENT_STATE = State.SETTINGS;
        }
      });
    });

    // fallback image on thumbnail load error
    document.querySelectorAll(".media-object").forEach((image) => {
      image.addEventListener("error", () => {
        image.setAttribute("src", "app/../../../../resources/images/musical_2.png");
      });
    });
  }

  window.bridgeApis.on("show-binary-download-dialog", (_event, shouldShow) => {
    const progressModal = document.querySelector(".modal-container");

    if (shouldShow) {
      progressModal.style.setProperty("display", "flex");
    } else {
      progressModal.style.setProperty("display", "none");
    }
  });

  // actions related to file downloads
  function displayProgress(_event, args) {
    const downloadEvent = args.event;
    const progress = args.progress;
    const elementId = `download-progress-${args.id}`;
    const progressBar = document.getElementById(elementId);
    const mediaBodyElement = progressBar.parentNode;
    const messageElement = mediaBodyElement.children[1];

    if (downloadEvent == "info") {
      messageElement.innerText = "Extracting info...";
      return;
    } else if (downloadEvent == "end") {
      messageElement.innerText = "Download finished";
    } else {
      messageElement.innerText = `${progress}% downloaded`;
    }

    progressBar.style.setProperty("--progress-anim", "none");
    progressBar.style.setProperty("--progress-width", `${progress}%`);
    // stop loading animation
    progressBar.children[0].classList.add("gone");

    if (downloadEvent == "end") finishDownloading();

    function finishDownloading() {
      const listItem = mediaBodyElement.parentElement;
      const downloadingListGroup = listItem.parentElement;

      const metadata = {
        data: { id: args.id, filename: args.filename, title: args.title },
        type: Type.DOWNLOADING /* type not needed now */
      };

      window.bridgeApis.invoke("finish-downloading", metadata).then((info) => {
        const [operationSuccessful, downloadedItemData] = info;

        if (operationSuccessful) {
          downloadingListGroup.removeChild(listItem);
          tryAddListItemDownloaded(downloadedItemData, true);

          if (downloadingListGroup.childNodes.length == 0) {
            tryAddListItemDownloading(null); // displays placeholder
          }
        } else {
          window.bridgeApis.send("show-error-unknown-dialog", {
            title: "An unknown error occurred",
            message: "We were unable to complete some operations"
          });
        }
      });
    }
  }
});
