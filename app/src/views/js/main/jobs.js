window.addEventListener("DOMContentLoaded", () => {
  let isOnline;
  const INTERVAL = 10000;

  const onlineStats = document.querySelector(".online-stat");

  setInterval(() => {
    let navigatorOnline;
    if (isOnline !== (navigatorOnline = window.navigator.onLine))
      navigatorOnline ? onlineStats.classList.add("online") : onlineStats.classList.remove("online");
  }, INTERVAL);
});
