export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;
  if (import.meta.env.VITE_APP_DESKTOP === "true") return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The app remains fully usable without offline caching.
    });
  });
}
