"use strict";
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");
const registerButton = document.getElementById("uv-register-sw");

if (registerButton) {
  if (typeof __uv$config !== "undefined" && location.pathname.startsWith(__uv$config.prefix)) {
    if (error) error.textContent = "Error: The service worker is not registered.";
    registerButton.classList.add("show");
  }

  registerButton.addEventListener("click", async () => {
    try {
      await registerSW();
      location.reload();
    } catch (err) {
      if (error) error.textContent = "Failed to register service worker.";
      if (errorCode) errorCode.textContent = err.toString();
      registerButton.classList.remove("show");
    }
  });
}
