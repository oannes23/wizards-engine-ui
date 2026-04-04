"use client";

/**
 * MSWProvider — conditionally activates the MSW browser service worker
 * when NEXT_PUBLIC_MSW=true.
 *
 * Must be rendered at the root of the app tree, before any API calls are made.
 * The worker is started asynchronously; children render immediately so the
 * service worker intercepts subsequent fetches (not the first render).
 *
 * Used only in E2E tests — never active in production.
 */

import { useEffect, useState } from "react";

interface MSWProviderProps {
  children: React.ReactNode;
}

export function MSWProvider({ children }: MSWProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MSW !== "true") {
      setReady(true);
      return;
    }

    async function startWorker() {
      const { worker } = await import("@/mocks/browser");
      await worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: {
          url: "/mockServiceWorker.js",
        },
      });
      setReady(true);
    }

    startWorker();
  }, []);

  // Block rendering until the service worker is registered so that
  // all API calls are intercepted from the first request.
  if (!ready) return null;

  return <>{children}</>;
}
