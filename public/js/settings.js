document.addEventListener("DOMContentLoaded", () => {
  const theme = localStorage.getItem("theme");
  const themeSelect = document.getElementById("theme-select");
  const proxyTransport = document.getElementById("proxy-transport");
  const proxyTransportValue = localStorage.getItem("transport");
  const searchEngine = localStorage.getItem("se");
  const searchEngineValue = document.getElementById("search-engine-select");
  const tipsEnabled = localStorage.getItem("disableTips");
  const tipsEnabledValue = document.getElementById("disableTips");
  const resetSettings = document.getElementById("reset-settings");
  const cloakReset = document.getElementById("cloak-reset");
  const proxyBackend = localStorage.getItem("proxy-backend");
  const proxyBackendToggle = document.getElementById("proxy-backend");
  const blobsCheckbox = document.getElementById("disableBlobs");
  const blobsEl = document.getElementById("blobs");
  const particlesCheckbox = document.getElementById("disableParticles");
  const particlesEl = document.getElementById("particles-js");
  const panicUrl = document.getElementById("panicUrl");
  const panicKey = document.getElementById("panicKey");

  if (panicUrl && panicKey) {
    panicUrl.value = localStorage.getItem("panicUrl") || "https://google.com";
    panicKey.value = localStorage.getItem("panicKey") || "~";
  }
  if (panicUrl) panicUrl.addEventListener("input", (e) => { localStorage.setItem("panicUrl", e.target.value); });
  if (panicKey) panicKey.addEventListener("input", (e) => { localStorage.setItem("panicKey", e.target.value); });

  if (particlesCheckbox && particlesEl) {
    particlesCheckbox.checked = localStorage.getItem("stars") === "true";
    particlesCheckbox.addEventListener("change", (e) => {
      localStorage.setItem("stars", e.target.checked);
      particlesEl.style.display = e.target.checked ? "block" : "none";
    });
  }
  if (blobsCheckbox && blobsEl) {
    blobsCheckbox.checked = localStorage.getItem("blobs") === "true";
    blobsCheckbox.addEventListener("change", (e) => {
      localStorage.setItem("blobs", e.target.checked);
      blobsEl.style.display = e.target.checked ? "block" : "none";
    });
  }

  if (proxyBackend && proxyBackendToggle) proxyBackendToggle.value = proxyBackend;
  if (proxyBackendToggle) proxyBackendToggle.addEventListener("change", (e) => { localStorage.setItem("proxy-backend", e.target.value); });

  if (cloakReset) cloakReset.addEventListener("click", () => { if (window.cloak) window.cloak.reset(); });

  if (resetSettings) resetSettings.addEventListener("click", () => {
    if (confirm("Reset all settings to default?")) { localStorage.clear(); location.reload(); }
  });

  if (tipsEnabledValue) {
    tipsEnabledValue.checked = tipsEnabled === "true";
    tipsEnabledValue.addEventListener("change", (e) => { localStorage.setItem("disableTips", e.target.checked); });
  }

  if (searchEngineValue) {
    if (searchEngine) searchEngineValue.value = searchEngine;
    searchEngineValue.addEventListener("change", (e) => { localStorage.setItem("se", e.target.value); });
  }

  if (proxyTransport) {
    const isVercelHost = location.hostname.endsWith(".vercel.app");
    // On Vercel, libcurl/epoxy need Wisp (WebSocket) which is unavailable on serverless.
    if (isVercelHost) {
      const migrated = localStorage.getItem("transport_migrated_from");
      if (migrated) {
        const warn = document.createElement("div");
        warn.style.cssText = "background:rgba(233,69,96,0.12);border:1px solid rgba(233,69,96,0.25);color:#ff8a9a;padding:8px 12px;border-radius:8px;font-size:12px;margin-top:6px;";
        warn.textContent = `Heads up: "${migrated}" needs Wisp (unavailable on Vercel). Auto-switched to "bare" for compatibility. Select "bare" to keep UV working on this host.`;
        proxyTransport.parentElement.appendChild(warn);
      }
      // Visually disable Wisp transports but keep them selectable so user sees why bare is forced.
      Array.from(proxyTransport.options).forEach((opt) => {
        if (opt.value === "epoxy" || opt.value === "libcurl") {
          opt.textContent += " (unavailable on Vercel — use Bare)";
          opt.style.color = "#888";
        }
      });
    }
    if (proxyTransportValue) proxyTransport.value = proxyTransportValue;
    // If still stuck on Wisp transport on Vercel, coerce to bare immediately.
    if (isVercelHost && (proxyTransport.value === "epoxy" || proxyTransport.value === "libcurl")) {
      proxyTransport.value = "bare";
      localStorage.setItem("transport", "bare");
    }
    proxyTransport.addEventListener("change", (e) => {
      if (isVercelHost && (e.target.value === "epoxy" || e.target.value === "libcurl")) {
        if (typeof Toastify !== "undefined") {
          Toastify({
            text: `"${e.target.value}" needs Wisp WebSockets which do not work on Vercel. Stay on "bare" or UV will show a 500 error.`,
            duration: 5000,
            gravity: "bottom",
            position: "right",
            style: { background: "#e94560", borderRadius: "8px" },
          }).showToast();
        } else {
          alert(`"${e.target.value}" needs Wisp WebSockets which are unavailable on Vercel. Use "bare" for UV to work on this host.`);
        }
        // Still allow the change (proxy.js will force bare), but warn user.
      }
      localStorage.setItem("transport", e.target.value);
      if (typeof window.setTransport === "function") window.setTransport(e.target.value);
    });
  }

  if (themeSelect) {
    if (theme) themeSelect.value = theme;
    themeSelect.addEventListener("change", (e) => {
      document.body.setAttribute("theme", e.target.value);
      localStorage.setItem("theme", e.target.value);
      if (typeof window.updateParticles === "function") window.updateParticles();
    });
  }

  const tabButtons = document.querySelectorAll(".tab-button");
  const tabs = document.querySelectorAll(".tab");
  function switchTab(newTab) {
    tabs.forEach((tab) => { tab.style.display = tab === newTab ? "flex" : "none"; });
  }
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      const tabName = button.id.replace("-tab", "");
      const newTab = document.querySelector(`[data-tab-name="${tabName}"]`);
      if (newTab) switchTab(newTab);
      localStorage.setItem("activeSettingstab", tabName);
    });
  });
  const activeTab = localStorage.getItem("activeSettingstab") || "style";
  const tabEl = document.getElementById(`${activeTab}-tab`);
  if (tabEl) tabEl.click();
});

function downloadBrowserBackup() {
  const backup = { localStorage: Object.fromEntries(Object.entries(localStorage)), sessionStorage: Object.fromEntries(Object.entries(sessionStorage)) };
  const blob = new Blob([btoa(JSON.stringify(backup))], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "backup.gameshub"; link.click();
  URL.revokeObjectURL(url);
}

function uploadBrowserBackup() {
  const input = document.createElement("input");
  input.type = "file"; input.accept = ".gameshub";
  input.addEventListener("change", (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const decoded = JSON.parse(atob(event.target.result));
        if (decoded.localStorage) Object.entries(decoded.localStorage).forEach(([k, v]) => localStorage.setItem(k, v));
        if (decoded.sessionStorage) Object.entries(decoded.sessionStorage).forEach(([k, v]) => sessionStorage.setItem(k, v));
        alert("Backup imported! Please refresh the page.");
      } catch (err) { alert("Import failed. File may be corrupted."); }
    };
    reader.readAsText(file);
  });
  input.click();
}
