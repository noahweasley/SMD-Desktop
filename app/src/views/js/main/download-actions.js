"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  const deleteAllButton = document.querySelector(".downloads-operation .delete");
  const downloadedList = document.querySelector(".list-group__downloaded");
  const downloadingList = document.querySelector(".list-group__downloading");

  deleteAllButton.addEventListener("click", () => {
    const currentActiveTab = getCurrentActiveTab();
    window.bridgeApis.invoke("delete-all", currentActiveTab).then((isSuccessful) => {
      console.log(isSuccessful ? "Deleted all files" : "Failed to delete");

      if (isSuccessful) {
        if (currentActiveTab == ".tab-content__downloaded") {
          while (downloadedList.firstChild) {
            downloadedList.removeChild(downloadedList.firstChild);
          }
          downloadedList.classList.add("gone");
          displayInfoPlaceholderById("info_decor__downloaded", true);
        } else {
          while (downloadingList.firstChild) {
            downloadingList.removeChild(downloadingList.firstChild);
          }
          displayInfoPlaceholderById("info_decor__downloading", true);
        }
      } else {
        window.bridgeApis.send("show-error-unknown-dialog", {
          title: "An unknown error occurred",
          message: "We were unable to complete some operations"
        });
      }
    });
  });

  function getCurrentActiveTab() {
    const downloadedContent = ".tab-content__downloaded";
    const downloadingContent = ".tab-content__downloading";
    const downloading = document.querySelector(downloadingContent);
    const isDownloadingActive = !downloading.classList.contains("gone");

    return isDownloadingActive ? downloadingContent : downloadedContent;
  }
});

function displayInfoPlaceholderById(placeholderId, shouldShow) {
  const infoPlaceholder = document.getElementById(placeholderId);
  if (shouldShow) {
    infoPlaceholder.style.setProperty("display", "flex");
  } else {
    infoPlaceholder.classList.remove("gone");
    infoPlaceholder.style.setProperty("display", "none");
  }
}
