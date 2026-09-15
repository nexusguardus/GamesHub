"use strict";
/**
 * @type {HTMLFormElement}
 */
const form = document.getElementById("proxy-form");
/**
 * @type {HTMLInputElement}
 */
const address = document.getElementById("proxy-address");
/**
 * @type {HTMLInputElement}
 */
const searchEngine = document.getElementById("proxy-search-engine");
/**
 * @type {HTMLParagraphElement}
 */
const error = document.getElementById("proxy-error");
/**
 * @type {HTMLPreElement}
 */
const errorCode = document.getElementById("proxy-error-code");

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

const wispUrl =
  (location.protocol === "https:" ? "wss" : "ws") +
  "://" +
  location.host +
  "/wisp/";
const bareUrl = location.protocol + "//" + location.host + "/bare/";

function getDefaultTransport() {
  // Wisp (WebSocket) is unavailable on Vercel serverless — bare HTTP works.
  const host = location.hostname;
  const isServerless =
    host.endsWith(".vercel.app") ||
    host.endsWith(".netlify.app") ||
    host === "littlexia.vercel.app";
  if (isServerless) return "bare";
  return "libcurl";
}

var transport = localStorage.getItem("transport");
if (!transport) {
  transport = getDefaultTransport();
  localStorage.setItem("transport", transport);
} else if (transport !== "bare" && location.hostname.endsWith(".vercel.app")) {
  // Auto-migrate stuck users: libcurl/epoxy require Wisp which fails on Vercel.
  const prev = transport;
  transport = "bare";
  localStorage.setItem("transport", transport);
  try {
    localStorage.setItem("transport_migrated_from", prev);
  } catch {}
  console.warn(`[UV] Transport "${prev}" needs Wisp (unavailable on Vercel). Auto-migrated to "bare".`);
}

async function setTransport(transportsel) {
  // Guard: on Vercel, force bare regardless of caller request
  if (location.hostname.endsWith(".vercel.app") && transportsel !== "bare") {
    console.warn(`[UV] Wisp transports unavailable on Vercel — forcing "bare" instead of "${transportsel}".`);
    transportsel = "bare";
    localStorage.setItem("transport", "bare");
  }
  try {
    if (transportsel == "epoxy") {
      await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
    } else if (transportsel == "libcurl") {
      await connection.setTransport("/libcurl/index.mjs", [{ wisp: wispUrl }]);
    } else {
      await connection.setTransport("/bareasmodule/index.mjs", [bareUrl]);
    }
    console.log(`[UV] Transport set to "${transportsel}"`);
  } catch (e) {
    console.error(`[UV] Failed to set transport "${transportsel}":`, e);
    if (transportsel !== "bare") {
      console.warn("[UV] Falling back to bare transport");
      try {
        await connection.setTransport("/bareasmodule/index.mjs", [bareUrl]);
        localStorage.setItem("transport", "bare");
        console.log('[UV] Fallback to "bare" succeeded');
      } catch (e2) {
        console.error("[UV] Bare fallback also failed:", e2);
      }
    }
  }
}
setTransport(transport);

window.setTransport = setTransport;

function encodeURL(url) {
  try {
    const encoded = __uv$config.prefix + __uv$config.encodeUrl(url);
    return encoded;
  } catch (e) {
    console.error("Error encoding URL:", e);
    if (errorCode) errorCode.textContent = "Error: " + e.message;
    if (error) error.style.display = "block";
    return null; // return null so caller knows it failed
  }
}

/**
 * Search engine templates keyed by the short names used in localStorage.
 * The Settings dropdown stores a full URL template instead (it always
 * contains "%s"), and both forms are accepted below.
 *
 * Default is Bing: DuckDuckGo answers the proxy's datacenter IP with
 * "DDG.deep.anomalyDetectionBlock(...)", which renders as DuckDuckGo's
 * "Unexpected error" page, and Google/Brave/Startpage serve bot blocks too.
 *
 * Kept inside the function on purpose: /go loads this file and /sj/index.js
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
function encodeTEXT(text) {
  const baseUrl = getSearchEngine().replace("%s", encodeURIComponent(text));

  try {
    return __uv$config.prefix + __uv$config.encodeUrl(baseUrl);
  } catch (e) {
    console.error("Error encoding URL:", e);
    if (errorCode) errorCode.textContent = "Error: " + e.message;
    if (error) error.style.display = "block";
    return null;
  }
}

function decodeURL(url) {
  try {
    const encoded = __uv$config.prefix + __uv$config.decodeURL(url);
    return encoded;
  } catch (e) {
    console.error("Error decoding URL:", e);
    if (errorCode) errorCode.textContent = "Error: " + e.message;
    if (error) error.style.display = "block";
    return null;
  }
}
function isValidURL(str) {
  if (/^https?:\/\//i.test(str)) return true;

  const domainPattern = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
  return domainPattern.test(str);
}

function encodeAny(input) {
  if (isValidURL(input)) {
    const url = /^https?:\/\//i.test(input) ? input : "http://" + input;
    return encodeURL(url);
  } else {
    return encodeTEXT(input);
  }
}

window.encodeURL = encodeURL;
window.decodeURL = decodeURL;
window.encodeTEXT = encodeTEXT;
window.encodeAny = encodeAny;
function start(url) {
  try {
    if (__uv$config.prefix && __uv$config) {
      sessionStorage.setItem("lpurl", encodeURL(url));
      location.href = "/go";
      sessionStorage.setItem("rawurl", url);
    }
  } catch (e) {
    if (errorCode) errorCode.textContent = "Error: " + e.message;
    if (error) error.style.display = "block";
    return;
  }
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (localStorage.getItem("proxy-backend") === "ultraviolet") {
      const url = search(address.value, getSearchEngine());
      start(url);
    } else {
      const res = window.sjEncodeAndGo(address.value);

      console.log(res);
      sessionStorage.setItem("lpurl", res);
      window.location.href = "/go";
    }
  });
}
console.log("Proxy started");
