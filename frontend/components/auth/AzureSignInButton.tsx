"use client";

import { Button } from "@/components/ui/button";
import { SessionProvider, signIn } from "next-auth/react";
import { TfiMicrosoftAlt } from "react-icons/tfi";

function AzureSignInButton({ baseUrl }: { baseUrl: string }) {
  return (
    <SessionProvider baseUrl={baseUrl}>
      <Button
        className="flex w-full h-11 mx-auto bg-[#2f2f2f] hover:bg-[#1f1f1f] text-white font-medium transition-all ease-in-out duration-200 shadow-sm"
        onClick={(e) => {
          e.preventDefault();
          signIn("customazure", {
            callbackUrl: "/",
          });
        }}
      >
        <TfiMicrosoftAlt className="mr-2 h-5 w-5" />
        Sign in with Microsoft
      </Button>
    </SessionProvider>
  );
}

export { AzureSignInButton };

