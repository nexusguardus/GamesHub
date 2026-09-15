"use strict";
/**
 * @type {HTMLFormElement}
 */
const sjform = document.getElementById("sj-form");
/**
 * @type {HTMLInputElement}
 */
const sjaddress = document.getElementById("sj-address");
/**
 * @type {HTMLInputElement}
 */
const sjsearchEngine = document.getElementById("sj-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const sjerror = document.getElementById("sj-error");
/**
 * @type {HTMLPreElement}
 */
const sjerrorCode = document.getElementById("sj-error-code");

const { ScramjetController } = $scramjetLoadController();

const scramjet = new ScramjetController({
  files: {
    wasm: "/scram/scramjet.wasm.wasm",
    all: "/scram/scramjet.all.js",
    sync: "/scram/scramjet.sync.js",
  },
  // Scramjet's bundled epoxy client requires an ABSOLUTE websocket URL.
  // The default relative "/wisp/" makes EpoxyClient throw
  // "Invalid URL scheme: None" and every proxied fetch fails.
  wisp:
    (location.protocol === "https:" ? "wss://" : "ws://") +
    location.host +
    "/wisp/",
});

scramjet.init();

window.scramjet = scramjet;

document.addEventListener("DOMContentLoaded", () => {
  const sjconnection = new BareMux.BareMuxConnection("/baremux/worker.js");
  registerSJSW();

  // On Vercel, epoxy's Wisp transport fails. Track so sjEncodeAndGo can use bare.
  const isVercelHost = location.hostname.endsWith(".vercel.app");

  if (!sjform) return;

  sjform.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
      await registerSJSW();
    } catch (err) {
      sjerror.textContent = "Failed to register service worker.";
      sjerrorCode.textContent = err.toString();
      throw err;
    }

    const url = search(sjaddress.value, sjsearchEngine.value);

    let frame = document.getElementById("sj-frame");
    frame.style.display = "block";
    let wispUrl =
      (location.protocol === "https:" ? "wss" : "ws") +
      "://" +
      location.host +
      "/wisp/";
    try {
      if ((await sjconnection.getTransport()) !== "/epoxy/index.mjs" && !isVercelHost) {
        await sjconnection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
      } else if (isVercelHost) {
        // On Vercel, ensure bare transport so Scramjet fetches don't hang on Wisp
        const bareUrl = location.protocol + "//" + location.host + "/bare/";
        try {
          await sjconnection.setTransport("/bareasmodule/index.mjs", [bareUrl]);
        } catch (e) {
          console.warn("[SJ] Vercel bare fallback failed:", e);
        }
      }
    } catch (e) {
      console.warn("[SJ] Failed to set transport:", e);
      if (isVercelHost) {
        try {
          const bareUrl = location.protocol + "//" + location.host + "/bare/";
          await sjconnection.setTransport("/bareasmodule/index.mjs", [bareUrl]);
        } catch (e2) {
          console.error("[SJ] Bare fallback also failed:", e2);
        }
      }
    }
    const sjEncode = scramjet.encodeUrl.bind(scramjet);
    frame.src = sjEncode(url);
  });
});

const sjEncode = scramjet.encodeUrl.bind(scramjet);

/**
 * Search engine templates keyed by the short names used in localStorage.
 * The Settings dropdown stores a full URL template instead (it always
 * contains "%s"), and both forms are accepted below.
 *
 * Default is Bing: DuckDuckGo answers the proxy's datacenter IP with
 * "DDG.deep.anomalyDetectionBlock(...)", which renders as DuckDuckGo's
 * "Unexpected error" page, and Google/Brave/Startpage serve bot blocks too.
 *
 * Kept inside the function on purpose: /go loads this file and /uv/proxy.js
 * into the same global scope, and top-level consts would collide.
 */
function getSearchEngine() {
  const templates = {
    bing: "https://www.bing.com/search?q=%s",
    ddg: "https://duckduckgo.com/?q=%s",
    google: "https://www.google.com/search?q=%s",
    yahoo: "https://search.yahoo.com/search?p=%s",
    brave: "https://search.brave.com/search?q=%s",
    startpage: "https://www.startpage.com/sp/search?query=%s",
  };
  const searchEngine = localStorage.getItem("se");
  // Settings stores a ready-made template; short keys come from older builds.
  if (searchEngine && searchEngine.includes("%s")) return searchEngine;
  return templates[searchEngine] || templates.bing;
}

function sjEncodeAndGo(url) {
  let finalurl;
  finalurl = search(url, getSearchEngine());
  return sjEncode(finalurl);
}

window.sjEncode = sjEncode;
window.sjEncodeAndGo = sjEncodeAndGo;
