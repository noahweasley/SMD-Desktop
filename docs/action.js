// date
const date = document.querySelector(".date");
const dateBegin = document.getElementById("begin")
const sendMailButton = document.getElementById("send-email");
const emailAddr = document.getElementById("email-addr");
const emailBody = document.getElementById("email-body");
const firstName = document.getElementById("first-name");
const lastName = document.getElementById("last-name");

let thisYear = new Date(Date.now()).getFullYear();

if (thisYear == dateBegin.innerText) {
  dateBegin.classList.add("gone");
}

date.innerText = thisYear;

sendMailButton.addEventListener("click", (event) => {
  event.preventDefault();

  let addr = emailAddr.innerText;
  let body = emailBody.innerText;
  let subject = `(SMD-Desktop) message from: ${firstName.innerText} ${lastName.innerText}`;
  sendEmail({ senderEmail: addr, emailSubject: subject, emailBody: body });
});

function sendEmail(config) {
  const { senderEmail, emailSubject, emailBody } = config;

  Email.send({
    Host: "smtp.gmail.com",
    Username: "smddesktopp@gmail.com",
    Password: "111119090",
    To: "smddesktopp@gmail.com",
    From: senderEmail,
    Subject: emailSubject,
    Body: emailBody
  }).then((_message) => {
    console.log(_message)
    alert("mail sent successufully");
  });
}

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
