import { LoginRequestSchema, TokenSchema, type LoginRequest } from "./model";

export async function fetchLogin(email: string, password: string) {
  try {
    const requestBody: LoginRequest = { email, password };
    LoginRequestSchema.parse(requestBody);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const data = await response.json();
    return TokenSchema.parse(data);
  } catch (error) {
    console.error("Error during login:", error);
    throw error;
  }
}

