"use client";

import { Button } from "@/components/ui/button";
import { SessionProvider, signIn } from "next-auth/react";
import { useState } from "react";

function AzureSignInButton({ baseUrl }: { baseUrl: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <SessionProvider baseUrl={baseUrl}>
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-2 bg-[#2F2F2F] hover:bg-[#2F2F2F]/90 text-white border-0"
        disabled={loading}
        onClick={(e) => {
          e.preventDefault();
          setLoading(true);
          signIn("customazure", {
            callbackUrl: "/",
          }).catch(() => {
            setLoading(false);
          });
        }}
      >
        {loading ? (
          <>
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connecting to Microsoft...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="10" height="10" fill="#F25022" />
              <rect x="11" width="10" height="10" fill="#7FBA00" />
              <rect y="11" width="10" height="10" fill="#00A4EF" />
              <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </>
        )}
      </Button>
    </SessionProvider>
  );
}

export { AzureSignInButton };

