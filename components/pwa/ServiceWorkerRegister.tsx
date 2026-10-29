"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // En desarrollo (next dev), desregistrar cualquier Service Worker previo y limpiar caché
    // para evitar que chunks antiguos de /_next/static/ bloqueen la hidratación e inputs de React.
    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        })
        .catch(() => {});

      if ("caches" in window) {
        caches
          .keys()
          .then((names) => {
            for (const name of names) {
              caches.delete(name);
            }
          })
          .catch(() => {});
      }
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => {
        // Silently ignore SW registration errors in restricted contexts
      });
  }, []);

  return null;
}

