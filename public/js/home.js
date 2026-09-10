document.addEventListener("DOMContentLoaded", () => {
  const greetings = ["Hello!", "Welcome!", "What can I help you with?", "Ready to explore!", "Let's go!"];
  const rngText = document.getElementById("rng-text");
  if (rngText) rngText.textContent = greetings[Math.floor(Math.random() * greetings.length)];

  // NOTE: #proxy-form submit is owned by /uv/proxy.js (UV backend) with
  // scramjet fallback. Do not bind another submit handler here.

  const input = document.getElementById("proxy-address");
  const autocomplete = document.getElementById("autocomplete");
  let debounceTimer;

  if (input && autocomplete) {
    input.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      const q = input.value.trim();
      if (q.length < 2) { autocomplete.style.display = "none"; return; }
      debounceTimer = setTimeout(() => {
        fetch(`/api/autocomplete?q=${encodeURIComponent(q)}`)
          .then((r) => r.json())
          .then((data) => {
            const items = Array.isArray(data) ? data : data[1] || [];
            if (!items || items.length === 0) { autocomplete.style.display = "none"; return; }
            autocomplete.innerHTML = "";
            items.slice(0, 6).forEach((suggestion) => {
              const div = document.createElement("div");
              div.textContent = typeof suggestion === "string" ? suggestion : suggestion.phrase;
              div.addEventListener("click", () => {
                input.value = div.textContent;
                autocomplete.style.display = "none";
                const form = document.getElementById("proxy-form");
                if (form) form.dispatchEvent(new Event("submit", { cancelable: true }));
              });
              autocomplete.appendChild(div);
            });
            autocomplete.style.display = "block";
          })
          .catch(() => { autocomplete.style.display = "none"; });
      }, 300);
    });

    document.addEventListener("click", (e) => {
      if (!autocomplete.contains(e.target) && e.target !== input) autocomplete.style.display = "none";
    });
  }

  function openApp(url) {
    sessionStorage.setItem("rawurl", url);
    if (localStorage.getItem("proxy-backend") === "ultraviolet") {
      sessionStorage.setItem("lpurl", window.encodeAny(url));
    } else {
      sessionStorage.setItem("lpurl", window.sjEncodeAndGo(url));
    }
    window.location.href = "/go";
  }
  window.openApp = openApp;

  const shortcutsContainer = document.querySelector(".shortcuts");
  const addShortcut = document.getElementById("add-shortcut");
  if (addShortcut && shortcutsContainer) {
    const saved = JSON.parse(localStorage.getItem("shortcuts") || "[]");
    saved.forEach((s) => addShortcutToDOM(s, shortcutsContainer));
    addShortcut.addEventListener("click", () => {
      const name = prompt("Shortcut name:");
      const url = prompt("Shortcut URL:");
      if (name && url) {
        const s = { name, url, icon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64` };
        saved.push(s); localStorage.setItem("shortcuts", JSON.stringify(saved));
        addShortcutToDOM(s, shortcutsContainer);
      }
    });
  }

  function addShortcutToDOM(s, container) {
    const div = document.createElement("div");
    div.className = "shortcut";
    div.innerHTML = `<div class="shortcut-icon"><img src="${s.icon}" alt="${s.name}"></div>`;
    div.addEventListener("click", () => openApp(s.url));
    container.insertBefore(div, document.getElementById("add-shortcut"));
  }
});
