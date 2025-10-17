import { AuthOptions } from "next-auth";
import { CustomAzureProvider } from "./provider/azure";
import { Session } from "next-auth";

interface MySession extends Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  tokens: {
    id_token: string;
    access_token: string;
  };
}

export const authOptions: AuthOptions = {
  providers: [CustomAzureProvider],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  },
  callbacks: {
    session: async ({ session, token }): Promise<MySession> => {
      return {
        user: {
          id: token.sub || "",
          name: session.user?.name || "",
          email: session.user?.email || "",
          image: session.user?.image || null,
        },
        tokens: {
          id_token: (token.idToken as string) || "",
          access_token: (token.accessToken as string) || "",
        },
        expires: session.expires,
      };
    },
    jwt: async ({ user, token, account }) => {
      if (user) {
        token.sub = user.id;
        token.idToken = account?.id_token || "";
        token.accessToken = account?.access_token || "";
        token.refreshToken = account?.refresh_token || "";

        // Store user info in token
        if (user.email) {
          token.email = user.email;
          token.name = user.name;
        }
      }
      return token;
    },
  },
  events: {
    async signOut(message) {
      console.log("User signed out:", message);
    },
    async session(message) {
      console.log("Session accessed:", message);
    }
  },
  debug: process.env.NODE_ENV === "development",
};

export type { MySession };

