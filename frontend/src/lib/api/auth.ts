import { apiClient } from "./client";

export type LoginRequest = {
  email: string;
  password: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export function login(
  data: LoginRequest,
): Promise<TokenResponse> {
  return apiClient<TokenResponse>(
    "/auth/login",
    {
      method: "POST",
      credentials: "include",
      body: JSON.stringify(data),
    },
  );
}

export function refreshToken(): Promise<TokenResponse> {
  return apiClient<TokenResponse>(
    "/auth/refresh",
    {
      method: "POST",
      credentials: "include",
    },
  );
}

export function logout(): Promise<{ message: string }> {
  return apiClient(
    "/auth/logout",
    {
      method: "POST",
      credentials: "include",
    },
  );
}