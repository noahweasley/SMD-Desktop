window.addEventListener("DOMContentLoaded", () => {
  let listData;
  let listDataSelected = {};
  //...
  const selectAll = document.getElementById("select-all");
  const buttons = document.querySelectorAll(".btn");
  const retryButton = document.getElementById("retry");
  const message = document.querySelector(".message");

  retryButton.addEventListener("click", () => {
    resetViewState();
    setTimeout(() => dataReveal(buttons), 3000);
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      // change the value of track collections in original list to the selected ones
      listData = Object.values(listDataSelected);
      window.bridgeApis.send("download-click-event", [button.id, listData]);
    });
  });

  setTimeout(dataReveal, 3000); // removes glitches in UI, but I have no idea why it does that

  function resetViewState() {
    const loader = document.querySelector(".loader");
    const errorDecoration = document.querySelector(".error-decor");

    errorDecoration.style.setProperty("display", "none");
    loader.classList.remove("gone");
    buttons.forEach((button) => button.setAttribute("disabled", true));
  }

  function dataReveal() {
    const loader = document.querySelector(".loader");
    const errorDecoration = document.querySelector(".error-decor");
    const listGroup = document.querySelector(".list-group");
    const list = document.querySelector(".list");

    window.bridgeApis.invoke("search-tracks").then((data) => {
      loader.classList.add("gone");
      if (data instanceof Object) {
        displayDataOnList(data, listGroup);
        list.classList.remove("gone");
        errorDecoration.style.setProperty("display", "none");
        buttons.forEach((button) => button.removeAttribute("disabled"));
      } else {
        list.classList.add("gone");
        errorDecoration.style.setProperty("display", "flex");
        message.innerText = data;
        buttons[0].removeAttribute("disabled");
      }

      selectAll.addEventListener("click", () => {
        const sa_IsChecked = selectAll.checked;
        const selectCheckboxes = document.querySelectorAll(".cbx-select");

        for (let x = 0; x < select.length; x++) {
          // select all the check-boxes in the list if the select-all check-box is checked or not
          selectCheckboxes[x].checked = sa_IsChecked;
          // add all the selected data to an object map, if the select-all check-box is checked or not
          sa_IsChecked ? (listDataSelected[`${x}`] = listData[x]) : delete listDataSelected[`${x}`];
        }
      });

      document.querySelectorAll(".cbx-select").forEach((s_cbx) => {
        let cbx_Index = Array.from(select).indexOf(s_cbx);
        // register click events for all check boxes on the list
        s_cbx.addEventListener("click", () => {
          if (s_cbx.checked) {
            // add track at selected index to object map
            listDataSelected[`${cbx_Index}`] = listData[cbx_Index];
          } else {
            // remove / delete track at selected index to object map
            delete listDataSelected[`${cbx_Index}`];
          }
        });
      });
    });
  }

  function displayDataOnList(data, list) {
    listData = data;

    persistDataOnList(list, data);

    function persistDataOnList(list, listData) {
      for (let x = 0; x < listData.length; x++) {
        appendListItem(x, list, listData[x]);
      }

      function appendListItem(position, list, listData) {
        // console.log(listData);
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
        selectionCheckbox.className = "cbx-select";
        selectionCheckbox.id = "select";

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
          thumbnailElement.setAttribute("src", "app/../../../../resources/build/graphics/musical_2.png");

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
          selectionCheckbox.id = "select";

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
