import { authOptions, MySession } from "@/app/api/auth/[...nextauth]/auth-option";
import { type ClassValue, clsx } from "clsx";
import { getServerSession } from "next-auth";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function fetchWithToken(
  url: string | URL | globalThis.URL,
  options?: RequestInit
) {
  // Try to get NextAuth session first (Azure AD login)
  const session = (await getServerSession(authOptions)) as MySession;
  
  if (session?.tokens?.id_token) {
    // User is authenticated via Azure AD
    return fetch(url, {
      ...options,
      headers: {
        ...(options?.headers || {}),
        Authorization: `Bearer ${session.tokens.id_token}`,
      },
    });
  }
  
  // Try to get traditional JWT token (email/password login)
  // Note: This runs on the server side, so we need to check cookies
  // For client-side calls, the token is in localStorage
  if (typeof window !== 'undefined') {
    // Client-side: use localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
      return fetch(url, {
        ...options,
        headers: {
          ...(options?.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } else {
    // Server-side: use cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (token) {
      return fetch(url, {
        ...options,
        headers: {
          ...(options?.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
    }
  }
  
  // No valid authentication found
  console.error("No valid session or token found");
  throw new Error("No token found");
}

export async function fetchWithProvidedToken(
  url: string | URL | globalThis.URL,
  token: string,
  options?: RequestInit
) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}


export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

