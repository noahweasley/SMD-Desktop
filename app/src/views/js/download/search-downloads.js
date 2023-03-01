"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  const errorDecoration = document.querySelector(".error-decor");
  let listData;
  let selectedListDataMap = {};
  // TODO: searchQueryList shouldn't exist as a separate array, it should be inside listData
  let searchQueryList = [];
  const selectAll = document.getElementById("select-all");
  const actionButtons = document.querySelectorAll(".btn");
  const retryButton = document.getElementById("retry");
  const message = document.querySelector(".message");

  retryButton.addEventListener("click", () => {
    resetViewState();
    setTimeout(() => dataReveal(actionButtons), 3000);
  });

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // change the value of track collections in original list to the selected ones
      if (button.id == "proceed-download") {
        // TODO: searchQueryList shouldn't exist as a separate array, it should be inside listData
        searchQueryList = Object.values(selectedListDataMap);
      }

      window.bridgeApis.send("download-click-event", [button.id, searchQueryList]);
    });
  });

  setTimeout(dataReveal, 3000); // removes glitches in UI, but I have no idea why it does that

  function resetViewState() {
    const loader = document.querySelector(".loader");
    const errorDecoration = document.querySelector(".error-decor");

    errorDecoration.style.setProperty("display", "none");
    loader.classList.remove("gone");
    actionButtons.forEach((button) => button.setAttribute("disabled", true));
  }

  function dataReveal() {
    const loader = document.querySelector(".loader");
    const listGroup = document.querySelector(".list-group");
    const list = document.querySelector(".list");

    window.bridgeApis.invoke("search-tracks").then((data) => {
      loader.classList.add("gone");
      if (data && data instanceof Array && data.length > 0) {
        displayDataOnList(data, listGroup);
        list.classList.remove("gone");
        errorDecoration.style.setProperty("display", "none");
        actionButtons[0].removeAttribute("disabled");
      } else {
        list.classList.add("gone");
        errorDecoration.style.setProperty("display", "flex");
        message.innerText = data;
      }

      // initialize checkboxes for use after populating data on the list

      const headerSelectCheckboxes = document.querySelectorAll(".cbx-select-header");
      const selectCheckboxes = document.querySelectorAll(".cbx-select");

      let headerCheckboxArray = Array.from(headerSelectCheckboxes);

      headerSelectCheckboxes.forEach((headerCbx) => {
        headerCbx.addEventListener("click", () => {
          let listGroupItemContainer = headerCbx.parentElement.parentElement.parentElement;
          let headerSelectIndex = headerCheckboxArray.indexOf(headerCbx);
          changeChildElementCheckboxStateOf(listGroupItemContainer, headerCbx, headerSelectIndex);
        });
      });

      // start select-all listener
      selectAll.addEventListener("click", () => {
        const saIsChecked = selectAll.checked;

        for (let i = 0; i < headerSelectCheckboxes.length; i++) {
          let headerSelectCheckbox = headerSelectCheckboxes[i];
          headerSelectCheckbox.checked = saIsChecked;

          for (let x = 0; x < selectCheckboxes.length; x++) {
            // select all the check-boxes in the list if the select-all check-box is checked or not
            selectCheckboxes[x].checked = saIsChecked;

            if (saIsChecked) {
              selectedListDataMap[`${x}`] = listData[i].searchQueryList[x];
              actionButtons[1].removeAttribute("disabled");
            } else {
              delete selectedListDataMap[`${x}`];
              actionButtons[1].setAttribute("disabled", true);
            }
          }
        }
      });
      // end select-all listener

      // start cbx-select listener
      let cbxList = document.querySelectorAll(".cbx-select");

      for (let index = 0; index < cbxList.length; index++) {
        let sCbx = cbxList[index];
        // register click events for all check boxes on the list
        sCbx.addEventListener("click", () => {
          if (sCbx.checked) {
            // add track at selected index to object map
            selectedListDataMap[`${index}`] = listData[0].searchQueryList[index];
            actionButtons[1].removeAttribute("disabled");
          } else {
            // remove / delete track at selected index to object map
            delete selectedListDataMap[`${index}`];
            if (Object.keys(selectedListDataMap).length === 0) {
              // very crazy, but I had to search for the header checkbox :)
              const parentHeaderCheckbox =
                sCbx.parentElement.parentElement.parentElement.firstElementChild.lastElementChild.firstElementChild;

              parentHeaderCheckbox.checked = false;
              actionButtons[1].setAttribute("disabled", true);
            }
          }
        });
      }
      // end cbx-select listener

      // looping through all child nodes of this list element and change the states of
      // every checkbox according to isChecked parameter
      function changeChildElementCheckboxStateOf(listItemContainer, headerCheckBox, position) {
        let listItemContainerChildNodes = listItemContainer.childNodes;
        let checkboxArray = Array.from(selectCheckboxes);
        let isChecked = headerCheckBox.checked;

        for (let x = 1; x < listItemContainer.childElementCount; x++) {
          let listItems = listItemContainerChildNodes[x];
          let inputElement = listItems.lastElementChild.firstElementChild;
          inputElement.checked = isChecked;

          let listIndex = checkboxArray.indexOf(inputElement);

          if (isChecked) {
            selectedListDataMap[`${listIndex}`] = listData[position].searchQueryList[listIndex];
            actionButtons[1].removeAttribute("disabled");
            headerCheckBox.checked = true;
          } else {
            delete selectedListDataMap[`${listIndex}`];
            if (Object.keys(selectedListDataMap).length === 0) {
              actionButtons[1].setAttribute("disabled", true);
              // TODO: Remove or fix this next line. Make it work or just remove it.
              // TODO: The feature already works somewhere else in the code
              headerCheckBox.checked = false;
            }
          }
        }
      }
    });
  }

  function displayDataOnList(data, list) {
    if (!data) return errorDecoration.style.setProperty("display", "flex");

    listData = data;

    persistDataOnList(list, data);

    function persistDataOnList(list, listData) {
      for (let x = 0; x < listData.length; x++) {
        appendListItem(x, list, listData[x]);
      }

      function appendListItem(position, list, listData) {
        const listGroupItemContainer = document.createElement("div");
        listGroupItemContainer.className = "list-group-item-container";

        const listGroupItemHeader = document.createElement("div");
        listGroupItemHeader.className = "list-group-item-header";

        const headerText = document.createElement("p");

        headerText.innerHTML = `Results for: &nbsp${listData.searchQuery}`;

        const labelElement = document.createElement("label");
        const selectionCheckbox = document.createElement("input");
        labelElement.setAttribute("for", "select");
        selectionCheckbox.setAttribute("type", "checkbox");
        selectionCheckbox.setAttribute("name", "select");
        selectionCheckbox.className = "cbx-select-header";
        selectionCheckbox.id = `select-header-${position}`;

        labelElement.appendChild(selectionCheckbox);

        listGroupItemHeader.appendChild(headerText);
        listGroupItemHeader.appendChild(labelElement);

        listGroupItemContainer.appendChild(listGroupItemHeader);

        for (let x = 0; x < listData.searchQueryList.length; x++) {
          let searchQueryList = listData.searchQueryList;
          let searchQueryTitle = searchQueryList[x].videoTitle;

          const listGroupItem = document.createElement("div");
          listGroupItem.className = "list-group-item";

          const thumbnailElement = document.createElement("img");
          thumbnailElement.className = "media-object pull-left";
          thumbnailElement.setAttribute("src", "app/../../../../resources/images/musical_2.png");

          const mediaBodyElement = document.createElement("div");
          mediaBodyElement.className = "media-body";

          const trackTitleElement = document.createElement("strong");
          trackTitleElement.innerHTML = `${x + 1}. &nbsp&nbsp&nbsp${searchQueryTitle}`;

          mediaBodyElement.appendChild(trackTitleElement);

          const labelElement = document.createElement("label");
          const selectionCheckbox = document.createElement("input");
          labelElement.setAttribute("for", "select");
          selectionCheckbox.setAttribute("type", "checkbox");
          selectionCheckbox.setAttribute("name", "select");
          selectionCheckbox.className = "cbx-select";
          selectionCheckbox.id = `select-${position}`;

          labelElement.appendChild(selectionCheckbox);

          listGroupItem.appendChild(thumbnailElement);
          listGroupItem.appendChild(mediaBodyElement);
          listGroupItem.appendChild(labelElement);

          listGroupItemContainer.appendChild(listGroupItem);
        }

        list.appendChild(listGroupItemContainer);
      }
    }
  }
});
