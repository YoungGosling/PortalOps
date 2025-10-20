import { AuthOptions } from "next-auth";
import { CustomAzureProvider } from "./providers/azure";
import { Session } from "next-auth";
import { apiClient } from "@/lib/api";

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
  portalOpsUser?: {
    userId: string;
    roles: string[];
    assignedServiceIds: string[];
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
      // Use cached data from token
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
        portalOpsUser: token.portalOpsUser as any,
      };
    },
    jwt: async ({ user, token, account }) => {
      if (user) {
        token.sub = user.id;
        token.idToken = account?.id_token || "";
        token.accessToken = account?.access_token || "";
        token.refreshToken = account?.refresh_token || "";

        try {
          // Try to fetch user from PortalOps backend
          if (token.email) {
            try {
              // Note: This will require backend API endpoint to support Azure AD user lookup
              // For now, we'll store the Azure user info
              token.portalOpsUser = {
                email: token.email,
                name: user.name,
                azureId: user.id,
              };
            } catch (error) {
              console.error("Error fetching PortalOps user:", error);
              // User might not exist in PortalOps yet - this is OK for first login
              token.portalOpsUser = null;
            }
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
          token.portalOpsUser = null;
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

