let allGames = [];

function applyFilters() {
  let filtered = allGames;
  const showProxy = document.getElementById("proxy-btn") && document.getElementById("proxy-btn").classList.contains("active");
  const showHtml5 = document.getElementById("html5-btn") && document.getElementById("html5-btn").classList.contains("active");

  if (!showProxy && !showHtml5) { renderGames([]); return; }
  if (showProxy && showHtml5) { filtered = allGames; } else {
    filtered = allGames.filter((game) => {
      if (showProxy && game.proxy) return true;
      if (showHtml5 && !game.proxy) return true;
      return false;
    });
  }

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    const searchValue = searchInput.value.toLowerCase();
    if (searchValue) { filtered = filtered.filter((game) => game.name.toLowerCase().includes(searchValue)); }
    searchInput.placeholder = `Search for ${filtered.length} game${filtered.length !== 1 ? "s" : ""}`;
  }
  renderGames(filtered);
}

function renderGames(games) {
  const gamesList = document.getElementById("games-list");
  if (!gamesList) return;
  gamesList.innerHTML = "";
  if (games.length === 0) {
    gamesList.innerHTML = '<p style="color:var(--text-color);opacity:0.7;">No games found.</p>';
    return;
  }

  const sortedGames = [...games].sort((a, b) => {
    if (a.top && !b.top) return -1;
    if (!a.top && b.top) return 1;
    if (a.new && !b.new) return -1;
    if (!a.new && b.new) return 1;
    return 0;
  });

  sortedGames.forEach((game, idx) => {
    const gameItem = document.createElement("div");
    gameItem.className = "game-item";
    gameItem.style.setProperty("--item-delay", `${idx * 0.03}s`);

    const img = document.createElement("img");
    img.alt = game.name;
    img.loading = "lazy";
    if (game.image) {
      img.src = game.image.startsWith("https://") ? game.image : `/cdn/${game.url.split("/")[0]}/${game.image}`;
    } else {
      img.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(game.name)}`;
    }
    gameItem.appendChild(img);

    const badgeContainer = document.createElement("div");
    badgeContainer.className = "badge-container";
    gameItem.appendChild(badgeContainer);

    if (game.top) { const b = document.createElement("span"); b.innerHTML = '<i class="fa-solid fa-fire"></i> HOT'; b.className = "badge"; badgeContainer.appendChild(b); }
    if (game.new) { const b = document.createElement("span"); b.innerHTML = '<i class="fa-solid fa-sparkles"></i> NEW'; b.className = "badge"; badgeContainer.appendChild(b); }

    const name = document.createElement("p");
    name.className = "game-link";
    name.textContent = game.name;
    gameItem.appendChild(name);

    const openGame = (e) => {
      e.preventDefault();
      if (game.proxy) {
        sessionStorage.setItem("rawurl", game.url);
        if (game.url.includes("jsdelivr")) {
          sessionStorage.setItem("lpurl", game.url);
        } else if (localStorage.getItem("proxy-backend") === "ultraviolet") {
          sessionStorage.setItem(
            "lpurl",
            __uv$config.prefix + __uv$config.encodeUrl(game.url)
          );
        } else {
          sessionStorage.setItem("lpurl", window.sjEncodeAndGo(game.url));
        }
      } else {
        sessionStorage.removeItem("rawurl");
        sessionStorage.setItem("lpurl", game.url);
      }
      window.location.href = "/go";
    };
    img.onclick = openGame;
    name.onclick = openGame;
    name.style.cursor = "pointer";

    gamesList.appendChild(gameItem);
  });
}

Promise.allSettled([
  fetch("/json/games.json").then((r) => r.json()),
  fetch("/json/games-local.json").then((r) => r.json()),
]).then((results) => {
  let gamesData1 = [], gamesData2 = [];
  if (results[0].status === "fulfilled") gamesData1 = results[0].value;
  if (results[1].status === "fulfilled") gamesData2 = results[1].value;
  allGames = [...gamesData1, ...gamesData2];
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.placeholder = `Search for ${allGames.length} games`;
  applyFilters();
}).catch(() => {
  fetch("/json/games.json").then((r) => r.json()).then((data) => {
    allGames = data;
    applyFilters();
  });
});

const searchInput = document.getElementById("search-input");
if (searchInput) searchInput.addEventListener("input", applyFilters);
const proxyBtn = document.getElementById("proxy-btn");
if (proxyBtn) proxyBtn.addEventListener("click", () => { proxyBtn.classList.toggle("active"); applyFilters(); });
const html5Btn = document.getElementById("html5-btn");
if (html5Btn) html5Btn.addEventListener("click", () => { html5Btn.classList.toggle("active"); applyFilters(); });
