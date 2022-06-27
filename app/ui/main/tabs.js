"use-strict";

function getElementIndex(element) {
  return Array.from(element.parentNode.children).indexOf(element);
}

function registerTabEvents(tabItem, ...tabContent) {
  // ...
  let tabContent_0 = document.getElementById(tabContent[0]);
  let tabContent_1 = document.getElementById(tabContent[1]);
  //...
  let isDownloadTabs = tabContent[0] === "tab-content__downloading" && tabContent[1] === "tab-content__downloaded";
  let pauseButton = document.querySelector(".pause");
  let refreshButton = document.querySelector(".refresh");
  let tabItems = document.querySelectorAll(tabItem);

  tabItems.forEach((tabItem) => {
    tabItem.addEventListener("click", (_event) => {
      // remove nav-item acive state
      for (x = 0; x < tabItems.length; x++) {
        tabItems[x].classList.remove("active");
      }
      tabItem.classList.add("active");

      // toggle tab content visibility
      if (getElementIndex(tabItem) === 0) {
        if (!tabContent_1.classList.contains("invisible")) {
          tabContent_1.classList.add("invisible");
        }

        if (isDownloadTabs) {
          pauseButton.setAttribute("disabled", "false");
          refreshButton.setAttribute("disabled", "false");
        }

        tabContent_0.classList.remove("invisible");
      } else {
        if (!tabContent_0.classList.contains("invisible")) {
          tabContent_0.classList.add("invisible");
        }

        if (isDownloadTabs) {
          pauseButton.setAttribute("disabled", "true");
          refreshButton.setAttribute("disabled", "true");
        }

        tabContent_1.classList.remove("invisible");
      }
    });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  registerTabEvents(".__tab-item", "tab-content__downloading", "tab-content__downloaded");
  registerTabEvents(".tab-item__form", "tab-content__form__spotify", "tab-content__form__youtube");
});
