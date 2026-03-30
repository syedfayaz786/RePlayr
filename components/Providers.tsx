"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-center"
        gutter={12}
        toastOptions={{
          duration: 2800,
          style: {
            background: "rgba(15,17,35,0.96)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "16px",
            fontFamily: "var(--font-body)",
            fontSize: "13.5px",
            fontWeight: 500,
            padding: "12px 18px",
            backdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            maxWidth: "360px",
          },
          success: {
            iconTheme: { primary: "#4ade80", secondary: "#0f1123" },
            style: {
              background: "rgba(15,17,35,0.96)",
              border: "1px solid rgba(74,222,128,0.2)",
            },
          },
          error: {
            // Errors should be inline — but if one slips through, style it gracefully
            iconTheme: { primary: "#ef4444", secondary: "#0f1123" },
            style: {
              background: "rgba(15,17,35,0.96)",
              border: "1px solid rgba(239,68,68,0.2)",
            },
          },
        }}
      />
    </SessionProvider>
  );
}
