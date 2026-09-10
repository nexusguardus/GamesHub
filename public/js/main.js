document.addEventListener("DOMContentLoaded", () => {
  if (!window.ConsoleLogged) {
    console.log(
      `%cGamesHub%c v7 - main.js Loaded`,
      "font-size: 16px; background-color: #9282fb; border-top-left-radius: 5px; border-bottom-left-radius: 5px; padding: 4px; font-weight: bold;",
      "font-size: 16px; background-color: #090810; font-weight: bold; padding: 4px; border-top-right-radius: 5px; border-bottom-right-radius: 5px;"
    );
    window.ConsoleLogged = true;
  }

  let theme = localStorage.getItem("theme");
  const background = localStorage.getItem("backgroundImage");

  if (!localStorage.getItem("defaultThemeSet")) {
    theme = "default";
    localStorage.setItem("theme", theme);
    localStorage.setItem("defaultThemeSet", "true");
    document.body.setAttribute("theme", theme);
  }

  if (background) {
    document.body.style.backgroundImage = `url(${background})`;
  }
  if (theme) {
    document.body.setAttribute("theme", theme);
  }

  window.updateParticles = function () {
    const checkTheme = localStorage.getItem("theme");
    switch (checkTheme) {
      default:
        if (localStorage.getItem("stars") === "true") {
          document.getElementById("particles-js").style.display = "block";
        }
        if (typeof particlesJS !== "undefined") {
          particlesJS("particles-js", { particles: { number: { value: 160, density: { enable: true, value_area: 800 } }, color: { value: "#ffffff" }, shape: { type: "circle", stroke: { width: 0, color: "#000000" }, polygon: { nb_sides: 5 }, image: { src: "img/github.svg", width: 100, height: 100 } }, opacity: { value: 1, random: true, anim: { enable: false, speed: 1, opacity_min: 0, sync: false } }, size: { value: 3, random: true, anim: { enable: false, speed: 4, size_min: 0.3, sync: false } }, line_linked: { enable: false, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 }, move: { enable: true, speed: 1, direction: "none", random: true, straight: false, out_mode: "out", bounce: false, attract: { enable: false, rotateX: 600, rotateY: 600 } } }, interactivity: { detect_on: "canvas", events: { onhover: { enable: false, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true }, modes: { grab: { distance: 400, line_linked: { opacity: 1 } }, bubble: { distance: 250, size: 0, duration: 2, opacity: 0, speed: 3 }, repulse: { distance: 400, duration: 0.4 }, push: { particles_nb: 4 }, remove: { particles_nb: 2 } } }, retina_detect: true });
        }
        break;
    }
  };

  if (typeof particlesJS !== "undefined") {
    updateParticles();
  }

  const prxBackend = localStorage.getItem("proxy-backend");
  if (!prxBackend) {
    localStorage.setItem("proxy-backend", "ultraviolet");
  }

  fetch("/api/version")
    .then((res) => res.json())
    .then((ver) => {
      const footer = document.querySelector(".footer");
      if (footer) {
        footer.insertAdjacentHTML(
          "beforeend",
          `<a class="link footer-version" href="https://github.com/thedogecraft/lunaar.org"> v${ver.version}</a>`
        );
      }
    });

  if (window.localStorage.getItem("disableTips") !== "true" && window.localStorage.getItem("v7toast") === "true") {
    const randomMessages = [
      "Did you know? GamesHub V7 is awesome!",
      "Luna AI is Amazing. You should try it out!",
      "350+ games and counting!",
      "Have you tried the new proxy backend scramjet?",
      "Did you know? You can set a panic button in settings",
      "Did you know? You can change themes in settings",
      "https://discord.gg/En5YJYWj3Z",
    ];
    const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
    if (typeof Toastify !== "undefined") {
      Toastify({
        text: message,
        duration: 3000,
        gravity: "bottom",
        position: "right",
        style: { background: "var(--primary-color)", borderRadius: "var(--border-radius)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
      }).showToast();
    }
  }
  if (localStorage.getItem("v7toast") !== "true") {
    if (typeof Toastify !== "undefined") {
      Toastify({
        text: "Welcome To GamesHub V7",
        duration: 5000,
        gravity: "bottom",
        position: "right",
        style: { background: "var(--accent-color)", borderRadius: "var(--border-radius)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
      }).showToast();
    }
    localStorage.setItem("v7toast", true);
  }

  let blobs = localStorage.getItem("blobs");
  let stars = localStorage.getItem("stars");

  if (!stars) { localStorage.setItem("stars", "true"); stars = "true"; }
  if (stars !== "true") { document.getElementById("particles-js").style.display = "none"; }
  if (!blobs) { localStorage.setItem("blobs", "true"); blobs = "true"; }
  if (blobs !== "true") { document.getElementById("blobs").style.display = "none"; }

  const panicUrl = localStorage.getItem("panicUrl");
  const panicKey = localStorage.getItem("panicKey");
  if (panicUrl && panicKey) {
    window.addEventListener("keydown", (e) => {
      if (e.key === panicKey) { window.location.href = panicUrl; }
    });
  }
  if (!panicUrl || !panicKey) {
    localStorage.setItem("panicUrl", "https://google.com");
    localStorage.setItem("panicKey", "~");
  }

  const panicBtn = document.getElementById("panicBtn");
  if (panicBtn) {
    panicBtn.addEventListener("click", () => { window.location.href = panicUrl || "https://google.com"; });
  }
});

const cloaks = [
  { name: "default", icon: "./media/logo.svg", title: "GamesHub" },
  { name: "drive", icon: "./media/cloaks/googledrive.png", title: "Home - Google Drive" },
  { name: "classroom", icon: "./media/cloaks/classroom.png", title: "Home - Classroom" },
  { name: "canvas", icon: "./media/cloaks/canvas.png", title: "Dashboard" },
  { name: "zoom", icon: "./media/cloaks/zoom.png", title: "Zoom" },
  { name: "khan", icon: "./media/cloaks/khan.ico", title: "Khan Academy" },
  { name: "wikipedia", icon: "./media/cloaks/wikipedia.ico", title: "Wikipedia" },
  { name: "desmos", icon: "./media/cloaks/desmos.ico", title: "Desmos Classroom Activities" },
  { name: "gforms", icon: "./media/cloaks/googleforms.png", title: "Start your quiz" },
  { name: "quizlet", icon: "./media/cloaks/quizlet.webp", title: "Online Flashcard Maker & Flashcard App | Quizlet" },
];

if (!localStorage.getItem("hasSetCloak")) {
  cloak.setCloak("Google Classroom", "./media/cloaks/classroom.png");
  localStorage.setItem("hasSetCloak", "true");
}
