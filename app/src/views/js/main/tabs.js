"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  const getElementIndex = (element) => Array.from(element.parentNode.children).indexOf(element);

  function registerTabEvents(tabItem, ...tabContent) {
    let tabContent_0 = document.getElementById(tabContent[0]);
    let tabContent_1 = document.getElementById(tabContent[1]);
    let isDownloadTabs = tabContent[0] === "tab-content__downloading" && tabContent[1] === "tab-content__downloaded";
    let pauseButton = document.querySelector(".pause");
    let refreshButton = document.querySelector(".refresh");
    let tabItems = document.querySelectorAll(tabItem);

    tabItems.forEach((tabItem) => {
      tabItem.addEventListener("click", () => {
        // remove nav-item active state
        for (let x = 0; x < tabItems.length; x++) {
          tabItems[x].classList.remove("active");
        }
        tabItem.classList.add("active");

        // toggle tab content visibility
        if (getElementIndex(tabItem) === 0) {
          if (!tabContent_1.classList.contains("gone")) {
            tabContent_1.classList.add("gone");
          }

          if (isDownloadTabs) {
            pauseButton.setAttribute("disabled", "false");
            refreshButton.setAttribute("disabled", "false");
          }

          tabContent_0.classList.remove("gone");
        } else {
          if (!tabContent_0.classList.contains("gone")) {
            tabContent_0.classList.add("gone");
          }

          if (isDownloadTabs) {
            pauseButton.setAttribute("disabled", "true");
            refreshButton.setAttribute("disabled", "true");
          }

          tabContent_1.classList.remove("gone");
        }
      });
    });
  }

  // register events for download list
  registerTabEvents(".__tab-item", "tab-content__downloading", "tab-content__downloaded");
  // register events for registration modal
  registerTabEvents(".tab-item__form", "tab-content__form__spotify", "tab-content__form__youtube");
  // register for events to update list
  // sent only to update the current selected tab, which is the "downloading" tab
  window.bridgeApis.on("download-list-update", () => document.getElementById("__tab-item__downloading").click());
});
