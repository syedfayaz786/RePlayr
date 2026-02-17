"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1c1c28",
            color: "#fff",
            border: "1px solid #2e2e42",
            borderRadius: "12px",
            fontFamily: "var(--font-body)",
          },
          success: {
            iconTheme: { primary: "#f97316", secondary: "#fff" },
          },
        }}
      />
    </SessionProvider>
  );
}
