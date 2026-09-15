/**
 * Bot-block notices for the proxy.
 *
 * Search engines decide whether to answer based on the IP that reaches them.
 * Proxied traffic leaves from the server's IP, which search engines treat as
 * a datacenter/bot IP, so they answer with their own anti-automation page
 * instead of results - DuckDuckGo renders "Unexpected error. Please try
 * again." and Google shows "Our systems have detected unusual traffic".
 *
 * Those pages are unhelpful on their own, so this watches the proxied frames
 * and explains what happened, then offers a one-tap retry on an engine that
 * answers the proxy (Bing).
 */
(function () {
  "use strict";

  if (window.__proxyNotice) return;
  window.__proxyNotice = true;

  var BING_TEMPLATE = "https://www.bing.com/search?q=%s";
  // Re-check after load: these pages often draw their error UI with JS.
  var RECHECK_DELAYS = [0, 1500, 4000];
  var INSPECT_LIMIT = 30000;

  /**
   * Anti-automation signatures. Each entry is [regex, engine label or null].
   * The engine name is only used when we know who answered; null means a
   * generic bot check.
   */
  var SIGNATURES = [
    [/anomalyDetectionBlock/i, "DuckDuckGo"],
    [/Unexpected error\. Please try again[^]*support email/i, "DuckDuckGo"],
    [/unusual traffic from your computer network|Our systems have detected unusual traffic/i, "Google"],
    [/Ecosia Firewall/i, "Ecosia"],
    [/automated queries/i, "Mojeek"],
    [/Access Denied[^]*Startpage|Startpage[^]*Temporarily Suspended/i, "Startpage"],
    [/Captcha - Brave Search/i, "Brave Search"],
    [/Select all squares|verify you are human|are you a robot|Confirm you are a human/i, null],
    [/Just a moment\.\.\.|Checking your browser before accessing|cf-challenge|Enable JavaScript and cookies to continue/i, null],
  ];

  function textOf(doc) {
    try {
      return doc.body ? doc.body.innerText || "" : "";
    } catch (e) {
      return "";
    }
  }

  function titleOf(doc) {
    try {
      return doc.title || "";
    } catch (e) {
      return "";
    }
  }

  function signatureIn(iframe) {
    var doc = iframe.contentDocument;
    if (!doc) return null; // cross-origin or not ready

    var haystack = (titleOf(doc) + "\n" + textOf(doc)).slice(0, INSPECT_LIMIT);

    for (var i = 0; i < SIGNATURES.length; i++) {
      if (SIGNATURES[i][0].test(haystack)) {
        return { engine: SIGNATURES[i][1], generic: SIGNATURES[i][1] === null };
      }
    }
    // The "Unexpected error" dialog is only DuckDuckGo's wording, and it is
    // long - the support-code sentence can be outside the inspected slice.
    if (/Unexpected error\. Please try again/i.test(haystack)) {
      return { engine: "DuckDuckGo", generic: false };
    }
    return null;
  }

  /** Pull the query the user originally asked for out of the tab's data. */
  function queryOf(iframe) {
    var raw = (iframe.dataset && iframe.dataset.originalUrl) || "";
    raw = raw.trim();
    if (!raw) return "";

    if (raw.indexOf("://") !== -1) {
      try {
        var url = new URL(raw);
        var q =
          url.searchParams.get("q") ||
          url.searchParams.get("query") ||
          url.searchParams.get("p") ||
          url.searchParams.get("text");
        return q || "";
      } catch (e) {
        return "";
      }
    }
    // A bare word or phrase was typed in the address bar.
    return raw;
  }

  function bingUrl(query) {
    return BING_TEMPLATE.replace("%s", encodeURIComponent(query));
  }

  function encodeForBackend(url) {
    // The proxy engine can change between loads, so read it each time.
    if (localStorage.getItem("proxy-backend") === "ultraviolet") {
      return typeof window.encodeAny === "function" ? window.encodeAny(url) : null;
    }
    return typeof window.sjEncodeAndGo === "function" ? window.sjEncodeAndGo(url) : null;
  }

  function banner(message, onClick) {
    var el = document.createElement("div");
    el.setAttribute("role", "status");
    el.style.cssText =
      "position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:100000;" +
      "max-width:min(560px,92vw);background:#1b1a2a;color:#e6e6f0;border:1px solid rgba(146,130,251,.5);" +
      "border-left:4px solid #9282fb;border-radius:10px;padding:12px 16px;font:14px/1.45 system-ui,sans-serif;" +
      "box-shadow:0 10px 30px rgba(0,0,0,.45);display:flex;gap:12px;align-items:flex-start";
    var text = document.createElement("div");
    text.textContent = message;
    var close = document.createElement("button");
    close.textContent = "\u00d7";
    close.setAttribute("aria-label", "Dismiss");
    close.style.cssText =
      "background:none;border:none;color:#8b8ba7;font-size:18px;line-height:1;cursor:pointer;padding:0";
    close.onclick = function () {
      el.remove();
    };
    el.appendChild(text);
    el.appendChild(close);
    if (onClick) {
      el.style.cursor = "pointer";
      el.title = "Click to try the same search on Bing";
      el.addEventListener("click", function (e) {
        if (e.target !== close) onClick();
      });
    }
    document.body.appendChild(el);
  }

  function notify(message, onClick) {
    if (typeof window.Toastify === "function") {
      window.Toastify({
        text: message,
        duration: 9000,
        close: true,
        gravity: "top",
        position: "center",
        onClick: onClick,
        style: {
          background: "linear-gradient(135deg,#1b1a2a,#2a2842)",
          border: "1px solid rgba(146,130,251,.5)",
          borderRadius: "10px",
          maxWidth: "min(560px,92vw)",
        },
      }).showToast();
      return;
    }
    banner(message, onClick);
  }

  function retryOnBing(iframe, query) {
    localStorage.setItem("se", BING_TEMPLATE);
    if (!query) return;
    var encoded = encodeForBackend(bingUrl(query));
    if (!encoded) return;
    iframe.dataset.originalUrl = bingUrl(query);
    iframe.src = encoded;
  }

  function inspect(iframe) {
    if (!iframe || iframe.dataset.proxyNoticeDone === "1") return;
    var src = iframe.getAttribute("src") || "";
    var proxied = src.indexOf("/uv/service/") === 0 || src.indexOf("/scramjet/") === 0;
    if (!proxied) return;

    var hit = signatureIn(iframe);
    if (!hit) return;

    iframe.dataset.proxyNoticeDone = "1";

    var query = queryOf(iframe);
    if (hit.generic) {
      notify(
        "This site is showing a bot check instead of its page. The proxy's IP is shared, so some sites ask for verification. Try reloading, or pick another site."
      );
      return;
    }

    var retry = function () {
      retryOnBing(iframe, query);
    };
    var tail = query
      ? "Click here to run it on Bing instead - Bing is now your default, since it answers the proxy."
      : "Bing is now your default search engine, since it answers the proxy.";
    notify(hit.engine + " blocked this search - it treats the proxy's IP as automated. " + tail, retry);
    // Persist the switch so the next search works without another notice.
    localStorage.setItem("se", BING_TEMPLATE);
  }

  function watch(iframe) {
    if (!iframe || iframe.dataset.proxyNoticeWatched === "1") return;
    iframe.dataset.proxyNoticeWatched = "1";
    RECHECK_DELAYS.forEach(function (delay) {
      if (delay === 0) {
        iframe.addEventListener("load", function () {
          inspect(iframe);
        });
      } else {
        iframe.addEventListener("load", function () {
          setTimeout(function () {
            inspect(iframe);
          }, delay);
        });
      }
    });
    // A frame that finished loading before this ran still needs a check.
    if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
      inspect(iframe);
    }
  }

  function start() {
    var frames = document.getElementById("frames");
    if (!frames) return;

    Array.prototype.forEach.call(frames.querySelectorAll("iframe"), watch);

    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (node) {
          if (node.tagName === "IFRAME") watch(node);
        });
      });
    }).observe(frames, { childList: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
