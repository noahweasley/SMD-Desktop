"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  const deleteAllButton = document.querySelector(".downloads-operation .delete");

  deleteAllButton.addEventListener("click", () => {
    const currentActiveTab = getCurrentActiveTab();
    window.bridgeApis.invoke("delete-all", currentActiveTab);
  });

  function getCurrentActiveTab() {
    const downloadedContent = ".tab-content__downloaded";
    const downloadingContent = ".tab-content__downloading";
    const downloading = document.querySelector(downloadingContent);
    const isDownloadingActive = !downloading.classList.contains("gone");

    return isDownloadingActive ? downloadingContent : downloadedContent;
  }
});
