"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  //...
  let navItems = document.querySelectorAll(".nav-group-item");
  navItems.forEach((navItem) => {
    navItem.addEventListener("click", (_event) => {
      // dont change active state of the file nav item
      if (Array.from(navItem.parentElement.children).indexOf(navItem) === 1) return;
      // remove nav-item acive state
      for (x = 0; x < navItems.length; x++) {
        navItems[x].classList.remove("active");
      }
      navItem.classList.add("active");
    });
  });

  // ...
  document.querySelectorAll(".media-object").forEach((m) => {
    m.addEventListener('error', () =>  m.setAttribute("src", "music.jpg"));
  });
  
});
