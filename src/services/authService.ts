/**
 * Admin authentication service for So Do Van Phuc.
 * 
 * Handles JWT-based login flow:
 * - POST /api/auth/login → receives JWT token
 * - Token stored in sessionStorage (cleared on tab close)
 * - Token attached to admin API requests via apiClient
 */

import { getApiBase, isApiConfigured } from './apiClient';

const TOKEN_KEY = 'gf_admin_token';
const TOKEN_EXPIRY_KEY = 'gf_admin_token_exp';

export interface LoginResult {
  ok: boolean;
  token?: string;
  expiresIn?: number;
  error?: string;
}

/**
 * Login with admin credentials.
 * Returns the JWT token on success.
 */
export async function login(username: string, password: string): Promise<LoginResult> {
  if (!isApiConfigured()) {
    return { ok: false, error: 'API is not configured' };
  }

  const url = `${getApiBase()}/api/auth/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const json = await response.json();

  if (json.ok && json.data?.token) {
    const { token, expiresIn } = json.data;
    const expiryTime = Date.now() + (expiresIn ?? 28800) * 1000;

    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryTime));

    return { ok: true, token, expiresIn };
  }

  return { ok: false, error: json.error ?? 'Login failed' };
}

/**
 * Get the stored admin token, or null if expired/missing.
 */
export function getToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiry) return null;

  // Check if token has expired
  if (Date.now() > Number(expiry)) {
    logout();
    return null;
  }

  return token;
}

/**
 * Check if admin is authenticated with a valid (non-expired) token.
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Clear admin session.
 */
export function logout(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
}
