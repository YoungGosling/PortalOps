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
      // If token refresh failed, force sign out
      if (token.error === "RefreshAccessTokenError") {
        console.error("Token refresh failed, session will be invalid");
        // Return a minimal session that will trigger re-authentication
        return {
          user: {
            id: "",
            name: "",
            email: "",
            image: null,
          },
          tokens: {
            id_token: "",
            access_token: "",
          },
          expires: new Date(0).toISOString(), // Set to expired
          portalOpsUser: undefined,
        };
      }

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
    jwt: async ({ user, token, account, trigger }) => {
      // Initial sign in
      if (account && user) {
        token.sub = user.id;
        token.idToken = account.id_token || "";
        token.accessToken = account.access_token || "";
        token.refreshToken = account.refresh_token || "";
        token.expiresAt = account.expires_at ? account.expires_at * 1000 : Date.now() + 60 * 60 * 1000; // expires_at is in seconds

        try {
          // Try to fetch user from PortalOps backend
          if (token.email) {
            try {
              token.portalOpsUser = {
                email: token.email,
                name: user.name,
                azureId: user.id,
              };
            } catch (error) {
              console.error("Error fetching PortalOps user:", error);
              token.portalOpsUser = null;
            }
          }
        } catch (error) {
          console.error("Error in JWT callback:", error);
          token.portalOpsUser = null;
        }
        
        return token;
      }

      // Return previous token if it hasn't expired yet
      if (Date.now() < (token.expiresAt as number)) {
        return token;
      }

      // Token has expired, try to refresh it
      console.log("Token expired, attempting to refresh...");
      try {
        const response = await fetch(
          `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: process.env.AZURE_AD_CLIENT_ID || "",
              client_secret: process.env.AZURE_AD_CLIENT_SECRET || "",
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          }
        );

        const refreshedTokens = await response.json();

        if (!response.ok) {
          console.error("Failed to refresh token:", refreshedTokens);
          throw new Error("Failed to refresh token");
        }

        console.log("Token refreshed successfully");
        return {
          ...token,
          idToken: refreshedTokens.id_token,
          accessToken: refreshedTokens.access_token,
          expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
        };
      } catch (error) {
        console.error("Error refreshing access token:", error);
        // Return token with error flag to trigger sign out
        return { ...token, error: "RefreshAccessTokenError" };
      }
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

