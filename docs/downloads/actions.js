const downloadListItems = document.querySelectorAll(".download-list-item");

downloadListItems.forEach((downloadListItem) => {
  const a = downloadListItem.firstElementChild;
  downloadListItem.addEventListener("click", () => {
    if (!window.getSelection().toString()) a.click();
  });
});
