import type { ReactNode } from "react";

/**
 * Auth layout — minimal, no navigation.
 * Used for login, setup, and join pages.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-page px-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
