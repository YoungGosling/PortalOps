"use client";

import { Button } from "@/components/ui/button";
import { SessionProvider, signIn } from "next-auth/react";
import { TfiMicrosoftAlt } from "react-icons/tfi";

function AzureSignInButton({ baseUrl }: { baseUrl: string }) {
  return (
    <SessionProvider baseUrl={baseUrl}>
      <Button
        className="flex w-full h-11 mx-auto bg-gray-900 hover:bg-gray-900/90 text-white font-semibold transition-all ease-in-out duration-300"
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

