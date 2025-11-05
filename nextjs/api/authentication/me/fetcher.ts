import { UserProfileSchema } from "./model";
import { fetchWithProvidedToken } from "@/lib/utils";
import { UnauthorizedError } from "@/lib/errors";
import { authOptions, MySession } from "@/app/api/auth/[...nextauth]/auth-option";
import { getServerSession } from "next-auth";

export async function fetchUserProfile(token?: string) {
  try {
    let response: Response;
    
    if (token) {
      // Token provided explicitly (email/password login from client)
      response = await fetchWithProvidedToken(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`,
        token,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      // No token provided, try to get from NextAuth session (Azure AD)
      const session = (await getServerSession(authOptions)) as MySession;
      
      if (!session?.tokens?.id_token) {
        throw new UnauthorizedError("No valid session or token found");
      }
      
      response = await fetchWithProvidedToken(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`,
        session.tokens.id_token,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!response.ok) {
      // Check if it's an unauthorized error (401)
      if (response.status === 401) {
        throw new UnauthorizedError(`Failed to fetch user profile: ${response.statusText}`);
      }
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    const data = await response.json();
    return UserProfileSchema.parse(data);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

