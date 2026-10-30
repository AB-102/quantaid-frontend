// src/components/common/UpdateBanner.tsx

import React, { useEffect, useState } from 'react';
import { MdClose } from 'react-icons/md';

const CHECK_INTERVAL_MS = 10 * 60 * 1000;

/** The built entry script, e.g. /assets/index-abc123.js. Its name changes with every build that changes the app. */
function entryScript(doc: Document): string | null {
  return doc.querySelector('script[type="module"][src]')?.getAttribute('src') ?? null;
}

/**
 * Offers a reload once a new release is live.
 * A tab left open keeps running the code it loaded, and the API only stays compatible with the previous release.
 * So every 10 minutes, and whenever the tab becomes visible again, this fetches the
 * site's index.html and compares its entry script with the running one.
 */
const UpdateBanner: React.FC = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // The dev server's page has no built entry script to compare
    if (import.meta.env.DEV) return;
    const running = entryScript(document);
    if (running === null) return;

    const check = () => {
      fetch('/', { cache: 'no-store' })
        .then(res => res.text())
        .then(html => {
          const latest = entryScript(new DOMParser().parseFromString(html, 'text/html'));
          if (latest !== null && latest !== running) setUpdateAvailable(true);
        })
        .catch(() => {
          // Offline, or the host is restarting: the next check tries again
        });
    };
    const checkWhenVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', checkWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', checkWhenVisible);
    };
  }, []);

  if (!updateAvailable || dismissed) return null;

  return (
    <div
      role="status"
      className="
        fixed bottom-4 left-1/2 z-2000 flex -translate-x-1/2 items-center gap-3
        rounded-lg border border-brand-border bg-brand-panel px-4 py-2 text-sm
        text-white shadow-lg
      "
    >
      <span>Quantaid has been updated.</span>
      <button
        type="button"
        onClick={() => { window.location.reload(); }}
        className="
          font-medium text-brand-focus
          hover:underline
        "
      >
        Reload
      </button>
      <button
        type="button"
        onClick={() => { setDismissed(true); }}
        aria-label="Dismiss"
        className="
          text-brand-gray
          hover:text-white
        "
      >
        <MdClose />
      </button>
    </div>
  );
};

export default UpdateBanner;
