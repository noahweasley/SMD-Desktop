function __exports() {
  /**
   * @returns The current date and time
   */
  function getCurrentDateTime() {
    const now = new Date();

    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();

    return `${day}/${month}/${year}@${hour}:${minute}:${second}`;
  }
  return { getCurrentDateTime };
}

module.exports = __exports();
