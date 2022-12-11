var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function() {
    
    var icon = this.firstElementChild;
    var panel = this.nextElementSibling;
    
    this.classList.toggle("acc-active");
    
    if (panel.style.display === "block") {
      panel.style.display = "none";
      icon.className = "fa fa-plus"
    } else {
      panel.style.display = "block";
      icon.className = "fa fa-minus"
    }
  });
}