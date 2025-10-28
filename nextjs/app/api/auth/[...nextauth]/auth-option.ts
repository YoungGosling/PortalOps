import { AuthOptions } from "next-auth";
import { CustomAzureProvider } from "./provider/azure";
import { Session } from "next-auth";
// import { fetchIsAdmin } from "../../admin/auth/fetcher";

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
  // isSuperAdmin: boolean;
}

export const authOptions: AuthOptions = {
  providers: [CustomAzureProvider],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    session: async ({ session, token }): Promise<MySession> => {
      // const isSuperAdmin = (await fetchIsAdmin(session.user?.email || "")).is_admin;
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
        // isSuperAdmin: isSuperAdmin,
      };
    },
    jwt: async ({ user, token, account }) => {
      if (user) {
        token.sub = user.id;
        token.idToken = account?.id_token || "";
        token.accessToken = account?.access_token || "";
        token.refreshToken = account?.refresh_token || "";

        // try {
        //   if (token.email) {
        //     token.isAdmin = (await fetchIsAdmin(token.email)).is_admin;
        //   } else {
        //     token.isAdmin = false;
        //   }
        // } catch (error) {
        //   console.error("Error fetching admin status in JWT callback:", error);
        //   token.isAdmin = false;
        // }
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};

export type { MySession };