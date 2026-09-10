document.addEventListener("DOMContentLoaded", function () {
  const navBar = `
<nav class="navbar">
    <div class="navbar-brand">
        <a href="/"><svg viewBox="0 0 100 100" width="40" height="20">
            <circle cx="50" cy="50" r="45" fill="var(--primary-color)" opacity="0.8"/>
            <text x="50" y="55" text-anchor="middle" fill="white" font-size="20" font-weight="bold">G</text>
        </svg></a>
    </div>
    <div class="navbar-links">
        <a href="/" class="navbar-link"><span class="icon"><i class="fas fa-home"></i></span> <p class="navbar-text">Home</p></a>
        <a href="/science" class="navbar-link"><span class="icon"><i class="fas fa-gamepad"></i></span> <p class="navbar-text">Games</p></a>
        <a href="/ai" class="navbar-link"><span class="icon"><i class="fas fa-robot"></i></span> <p class="navbar-text">AI</p></a>
        <a href="/math" class="navbar-link"><span class="icon"><i class="fas fa-th-large"></i></span> <p class="navbar-text">Apps</p></a>
        <a href="/settings" class="navbar-link"><span class="icon"><i class="fas fa-cog"></i></span> <p class="navbar-text">Settings</p></a>
        <a href="/hub" class="navbar-link" style="background:linear-gradient(135deg,#e94560,#ff6b6b);color:#fff;border-radius:999px;padding:6px 10px"><span class="icon">🌍</span> <p class="navbar-text">Duel Hub</p></a>
        <a href="/more" class="navbar-link"><span class="icon"><i class="fas fa-plus"></i></span> <p class="navbar-text">More</p></a>
    </div>
</nav>`;
  const container = document.querySelector(".navbar-container");
  if (container) {
    container.innerHTML = navBar;
  }
});
