import { getApiBase } from './apiClient';
import type { RoleStatus } from '../data/roles';

const AUTH_BASE = () => `${getApiBase()}/api/svp/auth`;

export interface UserRole {
  slug: string;
  name?: string;
  status: RoleStatus;
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

export interface RegisterResponse {
  message: string;
  token?: string;
  user?: AuthUser;
  approvedRoles?: UserRole[];
  pendingRoles?: UserRole[];
  requiresApproval?: boolean;
  accountStatus?: string;
}

export interface RegisterData {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  roleSlug?: string;
  roleSlugs?: string[];
  referralCode?: string;
}

export interface RegisterRoleData {
  roleSlug: string;
  reason?: string;
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${AUTH_BASE()}${path}`;
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = localStorage.getItem('svp_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, { ...options, headers });
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(json.error || json.message || `HTTP ${response.status}`);
    (error as any).status = response.status;
    (error as any).data = json.data || json;
    throw error;
  }

  return json.data ?? json;
}

export const authApi = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    return authFetch<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email: identifier, identifier, password }),
    });
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    const roleSlugs = data.roleSlugs?.length ? data.roleSlugs : data.roleSlug ? [data.roleSlug] : [];
    return authFetch<RegisterResponse>('/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: data.fullName,
        phone: data.phone,
        email: data.email,
        password: data.password,
        role_slug: roleSlugs[0],
        role_slugs: roleSlugs,
        referral_code: data.referralCode || undefined,
      }),
    });
  },

  async getMe(): Promise<AuthUser> {
    const response = await authFetch<{ user: AuthUser }>('/me', { method: 'GET' });
    return response.user;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return authFetch<{ message: string }>('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(token: string, email: string, password: string): Promise<{ message: string }> {
    return authFetch<{ message: string }>('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, email, password, new_password: password }),
    });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return authFetch<{ message: string }>('/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },

  async uploadAvatar(file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return authFetch<{ avatar: string }>('/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  async registerRole(data: RegisterRoleData): Promise<{ message: string }> {
    return authFetch<{ message: string }>('/register-role', {
      method: 'POST',
      body: JSON.stringify({ role_slug: data.roleSlug, reason: data.reason || '' }),
    });
  },
};
