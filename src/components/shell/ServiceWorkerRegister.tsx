"use client";

import { useEffect } from "react";

/** Registers the offline service worker (production builds only, so local
 * development is never served stale files). */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${base}/sw.js`, { scope: `${base}/` }).catch(() => {
      // Unsupported or blocked (e.g. private mode): the site just works online as before.
    });
  }, []);
  return null;
}
