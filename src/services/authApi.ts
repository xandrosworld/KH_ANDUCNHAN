/**
 * Auth API service for Sổ Đỏ Vạn Phúc.
 * All auth-related API calls are centralized here.
 */

import { getApiBase } from './apiClient';

const AUTH_BASE = () => `${getApiBase()}/api/svp/auth`;

// ─── Types ──────────────────────────────────────────────────────────

export interface UserRole {
  slug: string;
  name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
}

export interface AuthUser {
  id: string;
  svpId: string;
  email: string;
  phone: string;
  fullName: string;
  avatar: string;
  referralCode: string;
  roles: UserRole[];
  activeRole: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  roleSlug: string;
  referralCode?: string;
}

export interface RegisterRoleData {
  roleSlug: string;
}

// ─── Helper ─────────────────────────────────────────────────────────

async function authFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${AUTH_BASE()}${path}`;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Attach token if available
  const token = localStorage.getItem('svp_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });
  const json = await response.json();

  if (!response.ok) {
    const error = new Error(json.error || json.message || `HTTP ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = json.data || json;
    throw error;
  }

  return json.data ?? json;
}

// ─── API Functions ──────────────────────────────────────────────────

export const authApi = {
  /** POST /login - authenticate user */
  async login(email: string, password: string): Promise<LoginResponse> {
    return authFetch<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /** POST /register - create new account with role */
  async register(data: RegisterData): Promise<{ message: string }> {
    return authFetch<{ message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: data.fullName,
        phone: data.phone,
        email: data.email,
        password: data.password,
        role_slug: data.roleSlug,
        referral_code: data.referralCode || undefined,
      }),
    });
  },

  /** GET /me - get current user profile */
  async getMe(): Promise<AuthUser> {
    const response = await authFetch<{ user: AuthUser }>('/me', { method: 'GET' });
    return response.user;
  },

  /** POST /forgot-password */
  async forgotPassword(email: string): Promise<{ message: string }> {
    return authFetch<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  /** POST /reset-password */
  async resetPassword(token: string, email: string, password: string): Promise<{ message: string }> {
    return authFetch<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, email, password, new_password: password }),
    });
  },

  /** POST /change-password */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return authFetch<{ message: string }>('/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  /** POST /avatar (multipart form) */
  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return authFetch<{ avatar: string }>('/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  /** POST /register-role - add additional role to existing user */
  async registerRole(data: RegisterRoleData): Promise<{ message: string }> {
    return authFetch<{ message: string }>('/register-role', {
      method: 'POST',
      body: JSON.stringify({ role_slug: data.roleSlug }),
    });
  },
};
