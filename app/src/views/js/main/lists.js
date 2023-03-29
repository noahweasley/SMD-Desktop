"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  /* eslint-disable no-undef */
  let WINDOW_CONTENT_STATE = State.MAIN;
  const listData = [];

  window.bridgeApis.on("show-binary-download-dialog", (_event, shouldShow) => {
    const progressModal = document.querySelector(".modal-container");

    if (shouldShow) {
      progressModal.style.setProperty("display", "flex");
    } else {
      progressModal.style.setProperty("display", "none");
    }
  });

  window.bridgeApis.invoke("get-downloads-list-data").then((listData) => {
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
      displayAllInfoPlaceholders(true);
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

  window.bridgeApis.on("download-list-update", (_event, args) => {
    // append new data into current data
    tryAddListItemDownloading(args, true);
    registerEventListeners();
    // after changing UI states, start file downloads
    window.bridgeApis.send("initiate-downloads");
  });

  function displayAllInfoPlaceholders(shouldShow) {
    const infoPlaceholders = document.querySelectorAll(".info-decor");

    infoPlaceholders.forEach((infoPlaceholder) =>
      shouldShow
        ? infoPlaceholder.style.setProperty("display", "flex")
        : infoPlaceholder.style.setProperty("display", "none")
    );
  }

  function displayInfoPlaceholderById(placeholderId, shouldShow) {
    const infoPlaceholder = document.getElementById(placeholderId);
    if (shouldShow) {
      infoPlaceholder.style.setProperty("display", "flex");
    } else {
      infoPlaceholder.classList.remove("gone");
      infoPlaceholder.style.setProperty("display", "none");
    }
  }

  function tryAddListItemDownloading(item, shouldAppend) {
    const uLElement = document.querySelector(".list-group__downloading");

    if (!item) {
      uLElement.classList.add("gone");
      displayInfoPlaceholderById("info_decor__downloading", true);
    } else {
      uLElement.classList.remove("gone");
      displayInfoPlaceholderById("info_decor__downloading", false);

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
      const thumbnailElement = document.createElement("img");

      listElement.classList.add("list-group-item", "gone"); // create but don't display yet

      thumbnailElement.classList.add("media-object", "pull-left");
      thumbnailElement.setAttribute("draggable", "false");
      thumbnailElement.setAttribute("src", "app/../../../../resources/images/musical_2.png");

      listElement.append(thumbnailElement);
      listElement.append(createMediaBody(itemId, dbData));
      listElement.classList.remove("gone");
      return listElement;
    }

    function createMediaBody(itemId, data) {
      const mediaBody = document.createElement("div");
      const trackTitleElement = document.createElement("strong");
      const messageElement = document.createElement("p");
      const pauseIconContainer = document.createElement("div");
      const cancelIconContainer = document.createElement("div");
      const iconPause = document.createElement("span");
      const iconCancel = document.createElement("span");
      const downloadProgressElement = document.createElement("div");
      const loadingIndicatorElement = document.createElement("div");

      mediaBody.className = "media-body";
      trackTitleElement.innerHTML = `${data.TrackTitle}`;
      messageElement.innerText = data.Message;
      messageElement.classList.add("message");

      pauseIconContainer.classList.add("op-icon", "not-draggable", "pull-right");
      cancelIconContainer.classList.add("op-icon", "not-draggable", "pull-right");

      iconPause.classList.add("icon", "icon-pause", "icon-x2");
      iconCancel.classList.add("icon", "icon-cancel", "icon-x2");

      iconPause.addEventListener("click", () => {
        window.bridgeApis.invoke("pause-downloading", data).then((isPaused) => {
          if (isPaused) {
            /* empty */
          } else {
            /* empty */
          }
        });
      });

      iconCancel.addEventListener("click", () => {
        window.bridgeApis.invoke("cancel-downloading", data).then((isCancelled) => {
          if (isCancelled) {
            /* empty */
          } else {
            /* empty */
          }
        });
      });

      pauseIconContainer.append(iconPause);
      cancelIconContainer.append(iconCancel);

      downloadProgressElement.classList.add("horizontal-progress");
      downloadProgressElement.id = `download-progress-${itemId}`;
      loadingIndicatorElement.classList.add("load-indicator");
      downloadProgressElement.append(loadingIndicatorElement);

      mediaBody.append(trackTitleElement);
      mediaBody.append(messageElement);
      mediaBody.append(pauseIconContainer);
      mediaBody.append(cancelIconContainer);
      mediaBody.append(downloadProgressElement);

      return mediaBody;
    }
  }

  function tryAddListItemDownloaded(item, appendOnly) {
    const uLElement = document.querySelector(".list-group__downloaded");

    if (appendOnly && item) {
      appendListData();
      if (uLElement.classList.contains("gone")) uLElement.classList.remove("gone");
    } else {
      if (!item) {
        uLElement.classList.add("gone");
        displayInfoPlaceholderById("info_decor__downloaded", true);
      } else {
        displayInfoPlaceholderById("info_decor__downloaded", false);
        appendListData();
        if (item.length > 0) uLElement.classList.remove("gone");
      }
    }

    function appendListData() {
      for (let i = 0; i < item.length; i++) {
        const listElement = document.createElement("li");
        const thumbnailElement = document.createElement("img");

        listElement.classList.add("list-group-item"); // create but don't display yet
        thumbnailElement.classList.add("media-object", "pull-left");
        thumbnailElement.setAttribute("draggable", "false");
        thumbnailElement.setAttribute("src", "app/../../../../resources/images/musical_2.png");

        listElement.append(thumbnailElement);
        listElement.append(createMediaBody(uLElement.children.length, item[i]));

        uLElement.append(listElement);
      }
    }

    // creates a media body element
    function createMediaBody(_position, item) {
      const mediaBody = document.createElement("div");
      const trackTitleElement = document.createElement("strong");
      const messageElement = document.createElement("p");
      const folderIconContainer = document.createElement("div");
      const deleteIconContainer = document.createElement("div");
      const playIconContainer = document.createElement("div");
      const iconFolder = document.createElement("span");
      const iconTrash = document.createElement("span");
      const iconPlay = document.createElement("span");

      mediaBody.className = "media-body";
      // TODO: fix numbering details when list item deleted and add it to the list
      // ${position + 1}. was removed from track title
      trackTitleElement.innerText = `${item.TrackTitle}`;

      messageElement.innerText = item.TrackDownloadSize;
      messageElement.classList.add("message");

      folderIconContainer.classList.add("op-icon", "not-draggable", "pull-right");
      deleteIconContainer.classList.add("op-icon", "not-draggable", "pull-right");
      playIconContainer.classList.add("op-icon", "not-draggable", "pull-right");
      // ..
      iconFolder.classList.add("icon", "icon-folder", "icon-x2");
      iconTrash.classList.add("icon", "icon-trash", "icon-x2");
      iconPlay.classList.add("icon", "icon-play", "icon-x2");

      playIconContainer.addEventListener("click", () => window.bridgeApis.send("play-music", item.TrackUri));
      folderIconContainer.addEventListener("click", () => window.bridgeApis.send("navigate-link", "#music"));

      deleteIconContainer.addEventListener("click", () => {
        const args = { data: item, type: Type.DOWNLOADED };

        window.bridgeApis.invoke("delete-single", args).then((result) => {
          const [errorOccurred, isFileDeleted] = result;

          if (!errorOccurred && !isFileDeleted) {
            return;
          } else if (errorOccurred || !isFileDeleted) {
            window.bridgeApis.send("show-error-unknown-dialog", {
              title: "An unknown error occurred",
              message: "We were unable to complete some operations"
            });
          } else {
            const listItem = folderIconContainer.parentElement.parentElement;
            const listGroup = listItem.parentElement;

            listGroup.removeChild(listItem);
            if (listGroup.childNodes.length == 0) {
              displayInfoPlaceholderById("info_decor__downloaded", true);
              uLElement.classList.add("gone");
            }
          }
        });
      });

      folderIconContainer.append(iconFolder);
      deleteIconContainer.append(iconTrash);
      playIconContainer.append(iconPlay);

      mediaBody.append(trackTitleElement);
      mediaBody.append(messageElement);
      mediaBody.append(folderIconContainer);
      mediaBody.append(deleteIconContainer);
      mediaBody.append(playIconContainer);

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
          tryAddListItemDownloaded(downloadedItemData);

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
