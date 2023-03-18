// date
const date = document.querySelector(".date");
const dateBegin = document.getElementById("begin");

const thisYear = new Date(Date.now()).getFullYear();

if (thisYear == dateBegin.innerText) {
  dateBegin.classList.add("gone");
}

date.innerText = thisYear;

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
  //  Get the scroll button
  const scrollButton = document.getElementById("top-button");
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    scrollButton.classList.remove("gone");
  } else {
    scrollButton.classList.add("gone");
  }
};
