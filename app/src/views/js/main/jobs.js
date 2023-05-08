window.addEventListener("DOMContentLoaded", () => {
  const INTERVAL = 10000;
  const onlineStats = document.querySelector(".online-stat");
  let isOnline;

  setInterval(() => {
    if (isOnline !== (isOnline = window.navigator.onLine)) onlineStats.classList.toggle("online");
  }, INTERVAL);
});
