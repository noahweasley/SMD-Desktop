window.addEventListener("DOMContentLoaded", () => {
  let SELECTED_POS = [];
  let listData;
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
      window.bridgeApis.send("search-click-event", [button.id, listData, SELECTED_POS]);
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

    window.bridgeApis.invoke("download-data").then((data) => {
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
          SELECTED_POS[x] = sa_IsChecked;
          selectCheckboxes[x].checked = sa_IsChecked;
        }
      });

      document.querySelectorAll(".cbx-select").forEach((s_cbx) => {
        s_cbx.addEventListener("click", () => {
          SELECTED_POS[Array.from(select).indexOf(s_cbx)] = s_cbx.checked;
          console.log(SELECTED_POS);
        });
      });
    });
  }

  function displayDataOnList(data, list) {
    const downloadType = document.querySelector(".download-type");
    const type = document.querySelector(".download-type .type");
    const option = document.querySelector(".download-type .option");
    
    listData = data;
    downloadType.classList.remove("gone");
    
    if (data["type"] == "album") {
      type.innerText = "Album Title:";
      option.innerText = data.description.albumName;
      persistAlbumOnList(list, data["description"]);
    } else if (data["type"] == "playlist") {
      type.innerText = "Playlist Title:";
      option.innerText = data.description.playListName;
      persistPlaylistOnList(list, data["description"]);
    }

    function appendListItem(position, list, listItem) {
      const listElement = document.createElement("li");
      listElement.className = "list-group-item";
      const thumbnailElement = document.createElement("img");
      thumbnailElement.classList.add("media-object", "pull-left");

      thumbnailElement.setAttribute("src", "../assets/graphics/musical_2.png");
      
      const mediaBodyElement = document.createElement("div");
      const mediaBodyTitle = document.createElement("strong");
      const mediaBodyDescription = document.createElement("p");
      mediaBodyElement.className = "media-body";
      mediaBodyDescription.className = "message";
      mediaBodyTitle.innerHTML = `${position + 1}. &nbsp&nbsp&nbsp${listItem[position].songTitle}`;

      mediaBodyDescription.innerHTML = `<b>Artists</b>: ${listItem[position].artistNames}`;

      mediaBodyElement.appendChild(mediaBodyTitle);
      mediaBodyElement.appendChild(mediaBodyDescription);

      const labelElement = document.createElement("label");
      const selectionCheckbox = document.createElement("input");
      labelElement.setAttribute("for", "select");
      selectionCheckbox.setAttribute("type", "checkbox");
      selectionCheckbox.setAttribute("name", "select");
      selectionCheckbox.className = "cbx-select";
      selectionCheckbox.id = "select";

      labelElement.appendChild(selectionCheckbox);

      listElement.appendChild(thumbnailElement);
      listElement.appendChild(mediaBodyElement);
      listElement.appendChild(labelElement);
      list.appendChild(listElement);
    }
    
    function persistAlbumOnList(list, description) {
      const listItems = description["albumTracks"];
      for (let pos = 0; pos < listItems.length; pos++) {
        appendListItem(pos, list, listItems);
      }
    }

    function persistPlaylistOnList(list, description) {
      const listItems = description["trackCollection"];
      for (let pos = 0; pos < listItems.length; pos++) {
        appendListItem(pos, list, listItems);
      }
    }
  }
});
