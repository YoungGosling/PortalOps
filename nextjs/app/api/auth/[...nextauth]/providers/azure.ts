import { OAuthConfig } from "next-auth/providers/oauth";

interface AzureProfile {
  oid: string; // Object ID
  name: string; // Name of the user
  email: string; // User's email address
  picture?: string; // Optional user picture
}

export const CustomAzureProvider: OAuthConfig<AzureProfile> = {
  id: "customazure",
  name: "Microsoft Azure AD",
  type: "oauth",
  clientId: `${process.env.AZURE_AD_CLIENT_ID}`,
  checks: ["state", "nonce", "pkce"],
  clientSecret: `${process.env.AZURE_AD_CLIENT_SECRET}`,
  wellKnown: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
  idToken: true,
  authorization: {
    params: {
      scope: "openid offline_access profile email",
    },
  },
  profile(profile) {
    // Ensure profile and required fields exist
    if (!profile) {
      console.error("Azure profile is undefined");
      // Return a fallback profile with default values
      return {
        id: "unknown",
        name: "Unknown User",
        email: "unknown@example.com",
        image: undefined,
      };
    }

    return {
      id: profile.oid || "unknown",
      name: profile.name || "Unknown User",
      email: profile.email || "unknown@example.com",
      image: profile.picture,
    };
  },
};

