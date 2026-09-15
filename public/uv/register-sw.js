/**
 * The Ultraviolet and Scramjet backends share ONE service worker (see
 * /sw.js). Registering them separately does not work: the worker that
 * controls the document handles every request made by it, so a root-scoped
 * Scramjet worker swallowed all /uv/service/ traffic.
 */
const unifiedSW = "/sw.js";
const swAllowedHostnames = ["localhost", "127.0.0.1"];

async function registerSW() {
  if (!navigator.serviceWorker) {
    if (
      location.protocol !== "https:" &&
      !swAllowedHostnames.includes(location.hostname)
    )
      throw new Error("Service workers cannot be registered without https.");

    throw new Error("Your browser doesn't support service workers.");
  }

  await navigator.serviceWorker.register(unifiedSW, { scope: "/" });
}
registerSW();
