window.addEventListener("DOMContentLoaded", () => {
  const onlineStats = document.querySelector(".online-stat");
  const INTERVAL = 10000;
  let isOnline;

  setInterval(() => {
    let navigatorOnline;
    if (isOnline !== (navigatorOnline = window.navigator.onLine))
      navigatorOnline ? onlineStats.classList.add("online") : onlineStats.classList.remove("online");
  }, INTERVAL);
});
