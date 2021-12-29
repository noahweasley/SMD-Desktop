"use-strict";

window.addEventListener("DOMContentLoaded", () => {
  //...
  let navItems = document.querySelectorAll(".nav-group-item");
  navItems.forEach((navItem) => {
    const navItemChildren = Array.from(navItem.parentElement.children);

    navItem.addEventListener("click", (_event) => {
      // dont change active state of the file nav item
      if (navItemChildren.indexOf(navItem) === 1 || navItemChildren.indexOf(navItem) === navItemChildren.length - 2) {
        return;
      }
      // remove nav-item acive state
      for (x = 0; x < navItems.length; x++) {
        navItems[x].classList.remove("active");
      }
      navItem.classList.add("active");
    });
  });

  // ...
  document.querySelectorAll(".media-object").forEach((m) => {
    m.addEventListener("error", () => m.setAttribute("src", "../assets/graphics/musical.png"));
  });
});
