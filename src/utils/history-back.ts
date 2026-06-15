declare global {
  interface Window {
    __historyBackPageLoadBound?: boolean;
  }
}

export const initHistoryBackLinks = () => {
  document.querySelectorAll<HTMLAnchorElement>("[data-history-back]").forEach((link) => {
    if (link.dataset.historyBackInitialized === "true") {
      return;
    }

    link.dataset.historyBackInitialized = "true";
    link.addEventListener("click", (event) => {
      if (!document.referrer || window.history.length <= 1) {
        return;
      }

      let referrerUrl: URL;
      try {
        referrerUrl = new URL(document.referrer);
      } catch {
        return;
      }

      if (referrerUrl.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();
      window.history.back();
    });
  });
};

export const bindHistoryBackLinks = () => {
  initHistoryBackLinks();

  if (window.__historyBackPageLoadBound) {
    return;
  }

  window.__historyBackPageLoadBound = true;
  document.addEventListener("astro:page-load", initHistoryBackLinks);
};
