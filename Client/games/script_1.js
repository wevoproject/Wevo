const body = document.body;
const burgerBtn = document.getElementById("burgerBtn");
const burgerIcon = document.getElementById("burgerIcon");
const notifBtn = document.getElementById("notifBtn");

burgerBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = body.classList.toggle("menu-open");
  body.classList.remove("menu-notif-open");

  burgerIcon.src = open ? burgerIcon.dataset.open : burgerIcon.dataset.closed;
});

notifBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  body.classList.toggle("menu-notif-open");
  body.classList.remove("menu-open");
});

document.addEventListener("click", () => {
  body.classList.remove("menu-open", "menu-notif-open");
});

function showAlert(type, message) {
  const container = document.getElementById("alerts");

  const alert = document.createElement("div");
  alert.className = `ui-alert ${type}`;

  alert.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9"></circle>
      <line x1="12" y1="10.5" x2="12" y2="16"></line>
      <circle class="small-dot" cx="12" cy="7.3" r="0.6"></circle>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = "0";
    alert.style.transform = "translateX(20px)";
    setTimeout(() => alert.remove(), 300);
  }, 3500);
}
