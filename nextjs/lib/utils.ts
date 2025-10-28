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
  const session = (await getServerSession(authOptions)) as MySession;
  if (!session || !session.tokens?.id_token) {
    console.error("No valid session or token found");
    throw new Error("No token found");
  }
  return fetch(url, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Authorization: `Bearer ${session.tokens.id_token}`,
    },
  });
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

