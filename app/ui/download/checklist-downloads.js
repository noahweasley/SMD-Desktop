window.addEventListener("DOMContentLoaded", () => {
  let SELECTED_POS = [];
  let listData;
  //...
  const selectAll = document.getElementById("select-all");
  const select = document.querySelectorAll(".cbx-select");
  const buttons = document.querySelectorAll(".btn");
  const retryButton = document.getElementById("retry");
  const message = document.querySelector(".message");

  selectAll.addEventListener("click", () => selectAllDownloads(selectAll.checked, select));

  select.forEach((s_cbx) => {
    s_cbx.addEventListener("click", () => {
      SELECTED_POS[Array.from(select).indexOf(s_cbx)] = s_cbx.checked;
      console.log(SELECTED_POS);
    });
  });

  retryButton.addEventListener("click", () => {
    resetViewState();
    setTimeout(() => dataReveal(buttons), 3000);
  });

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      window.bridgeApis.send("download-click-event", [button.id, listData, SELECTED_POS]);
    });
  });

  setTimeout(dataReveal, 3000); // removes glitches in UI, but I have no idea why it does that

  function selectAllDownloads(sa_IsChecked, select) {
    // select.forEach((cbx) => (cbx.checked = sa_IsChecked));
    for (let x = 0; x < select.length; x++) {
      SELECTED_POS[x] = sa_IsChecked;
      cbx.checked = sa_IsChecked;
    }
  }

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

    const list = document.querySelector(".list-group");

    window.bridgeApis.invoke("download-data").then((data) => {
      loader.classList.add("gone");
      if (data instanceof Object) {
        displayDataOnList(data, list);
        list.classList.remove("gone");
        errorDecoration.style.setProperty("display", "none");
        buttons.forEach((button) => button.removeAttribute("disabled"));
      } else {
        list.classList.add("gone");
        errorDecoration.style.setProperty("display", "flex");
        message.innerText = data;
        buttons[0].removeAttribute("disabled");
      }
    });
  }

  function displayDataOnList(data, list) {
    listData = data;
    if (data["type"] == "album") {
      persistAlbumOnList(list, data["description"]);
    }

    function persistAlbumOnList(list, description) {
      for (let pos = 0; pos < description["albumTracks"].length; pos++) {
        appendListItem(pos, list, description);
      }

      function appendListItem(position, list, description) {
        //   <li class="list-group-item">
        //   <img
        //     class="media-object pull-left"
        //     src="../../sample-images/alexandre-debieve-FO7JIlwjOtU-unsplash.jpg"
        //   />

        //   <div class="media-body">
        //     <strong>8. Middle Finger</strong>
        //     <p class="message">Failed to download, please try again</p>
        //   </div>

        //   <label for="select">
        //     <input type="checkbox" name="select" id="select" class="cbx-select" />
        //   </label>
        // </li>
        const listElement = document.createElement("li");
        const thumbnailElement = document.createElement("img");
        thumbnailElement.classList.add("media-object", "pull-left");
        
        thumbnailElement.setAttribute("src", description.thumbnails[0]);
        listElement.appendChild(thumbnailElement);
        
        list.appendChild(listElement);
      }
    }
  }

  // end DOMContentLoaded callbck
});
