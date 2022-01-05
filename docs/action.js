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

function getOS() {
  let userAgent = window.navigator.userAgent,
    platform = window.navigator.platform,
    macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
    windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
    os = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = "Mac OS";
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = "Windows";
  } else if (!os && /Linux/.test(platform)) {
    os = "Linux";
  }
  return os;
}

const downloadButton = document.querySelector(".download");
const osSpan = document.querySelector(".os");
const osIcon = downloadButton.firstChild;

let os = getOS();

if (os) {
  osSpan.innerText = os;
  if (os == "Windows") {
    osIcon.className = "fa fa-windows";
  } else if (os == "Mac Os") {
    osIcon.className = "fa fa-apple";
  } else {
    osIcon.className = "fa fa-linux";
  }
} else {
  downloadButton.innerText = "Not supported on your device";
  downloadButton.setAttribute("disabled", "true");
}

// date
const date = document.querySelector(".date");
date.innerText = new Date(Date.now()).getFullYear();
