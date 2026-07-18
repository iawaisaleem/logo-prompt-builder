(function () {
  "use strict";

  // Dismissible flash messages
  document.querySelectorAll(".flash-dismiss").forEach((btn) => {
    btn.addEventListener("click", () => {
      const flash = btn.closest(".flash");
      if (flash) flash.remove();
    });
  });

  // Show/hide password toggles (login + register)
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    const targetId = btn.getAttribute("data-toggle-for");
    const input = targetId ? document.getElementById(targetId) : null;
    if (!input) return;

    btn.addEventListener("click", () => {
      const isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      btn.textContent = isHidden ? "Hide" : "Show";
      btn.setAttribute("aria-pressed", String(isHidden));
    });
  });
})();
