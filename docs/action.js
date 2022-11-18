// date
const date = document.querySelector(".date");
const dateBegin = document.getElementById("begin");

let thisYear = new Date(Date.now()).getFullYear();

if (thisYear == dateBegin.innerText) {
  dateBegin.classList.add("gone");
}

date.innerText = thisYear;

sendMailButton.addEventListener("click", (event) => {
  event.preventDefault();
  alert("This feature hasn't been implemented yet");
});

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
  //  Get the scroll button
  const scrollbutton = document.getElementById("top-button");
  if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
    scrollbutton.classList.add("scale-1");
  } else {
    scrollbutton.classList.remove("scale-1");
  }
};
