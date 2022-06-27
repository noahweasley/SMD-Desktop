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
  
      window.bridgeApis.invoke("search-tracks").then((data) => {
        loader.classList.add("gone");
        if (data instanceof Object) {
          displayDataOnList(data, listGroup);
          list.classList.remove("gone");
          errorDecoration.style.setProperty("display", "none");
          buttons.forEach((button) => button.removeAttribute("disabled"));
        } else if (data instanceof String) {
          list.classList.add("gone");
          errorDecoration.style.setProperty("display", "flex");
          message.innerText = data;
          buttons[0].removeAttribute("disabled");
        } else {
          list.classList.add("gone");
          errorDecoration.style.setProperty("display", "flex");
          message.innerText = "Something went wrong";
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


    }
  });
  