import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
    };
    tokens?: {
      id_token: string;
      access_token: string;
    };
    portalOpsUser?: {
      userId: string;
      roles: string[];
      assignedServiceIds: string[];
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    portalOpsUser?: {
      userId?: string;
      roles?: string[];
      assignedServiceIds?: string[];
      email?: string;
      name?: string;
      azureId?: string;
    } | null;
    error?: string;
  }
}

