import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  authApi,
  type AuthUser,
  type LoginResponse,
  type RegisterData,
  type RegisterResponse,
  type UserRole,
} from '../services/authApi';
import {
  getRoleDashboardPath,
  ROLE_DEFINITIONS,
  ROLE_NAMES,
} from '../data/roles';

export type { UserRole, AuthUser };
export { getRoleDashboardPath, ROLE_NAMES };

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  approvedRoles?: UserRole[];
  error?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  logout: () => void;
  setActiveRole: (slug: string) => void;
  hasRole: (slug: string) => boolean;
  hasApprovedRole: (slug: string) => boolean;
  approvedRoles: UserRole[];
  pendingRoles: UserRole[];
  refreshUser: () => Promise<void>;
}

const TOKEN_KEY = 'svp_token';
const ACTIVE_ROLE_KEY = 'svp_active_role';
const OLD_TOKEN_KEYS = ['gf_token', 'gf_admin_token'];
const ADMIN_ROLE_SLUG = 'admin';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function migrateToken(): string | null {
  const existing = localStorage.getItem(TOKEN_KEY);
  if (existing) return existing;

  for (const oldKey of OLD_TOKEN_KEYS) {
    const old = localStorage.getItem(oldKey) || sessionStorage.getItem(oldKey);
    if (old) {
      localStorage.setItem(TOKEN_KEY, old);
      localStorage.removeItem(oldKey);
      sessionStorage.removeItem(oldKey);
      return old;
    }
  }

  return null;
}

function actualApprovedOf(userData: AuthUser | null): UserRole[] {
  return userData?.roles.filter((role) => role.status === 'approved') ?? [];
}

function approvedOf(userData: AuthUser | null): UserRole[] {
  const actualApproved = actualApprovedOf(userData);
  const canImpersonateRoles = actualApproved.some((role) => role.slug === ADMIN_ROLE_SLUG);
  if (!canImpersonateRoles) return actualApproved;

  const actualBySlug = new Map(actualApproved.map((role) => [role.slug, role]));
  return ROLE_DEFINITIONS.map((definition) => {
    const actualRole = actualBySlug.get(definition.slug);
    return actualRole
      ? { ...actualRole, name: actualRole.name || definition.shortLabel }
      : { slug: definition.slug, name: definition.shortLabel, status: 'approved' };
  });
}

function pendingOf(userData: AuthUser | null): UserRole[] {
  return userData?.roles.filter((role) => role.status === 'pending') ?? [];
}

function withResolvedActiveRole(userData: AuthUser): AuthUser {
  const approved = approvedOf(userData);
  const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY);
  const savedIsApproved = savedRole && approved.some((role) => role.slug === savedRole);

  const activeRole = savedIsApproved
    ? savedRole
    : userData.activeRole && approved.some((role) => role.slug === userData.activeRole)
      ? userData.activeRole
      : approved[0]?.slug || '';

  if (activeRole) {
    localStorage.setItem(ACTIVE_ROLE_KEY, activeRole);
  } else {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
  }

  return { ...userData, activeRole };
}

function storeLoginResponse(response: LoginResponse, setToken: (token: string | null) => void, setUser: (user: AuthUser | null) => void) {
  const resolvedUser = withResolvedActiveRole(response.user);
  localStorage.setItem(TOKEN_KEY, response.token);
  setToken(response.token);
  setUser(resolvedUser);
  return resolvedUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const storedToken = migrateToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);

      try {
        const userData = await authApi.getMe();
        setUser(withResolvedActiveRole(userData));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ACTIVE_ROLE_KEY);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const approvedRoles = approvedOf(user);
  const pendingRoles = pendingOf(user);

  const login = useCallback(async (identifier: string, password: string): Promise<LoginResult> => {
    try {
      const response = await authApi.login(identifier, password);
      const resolvedUser = storeLoginResponse(response, setToken, setUser);
      return { success: true, user: resolvedUser, approvedRoles: approvedOf(resolvedUser) };
    } catch (error: any) {
      if (error.status === 403) {
        return {
          success: false,
          error: 'pending',
          user: error.data?.user,
        };
      }
      return {
        success: false,
        error: error.message || 'Đăng nhập thất bại. Vui lòng thử lại.',
      };
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<RegisterResponse> => {
    const response = await authApi.register(data);
    if (response.token && response.user) {
      const resolvedUser = storeLoginResponse({ token: response.token, user: response.user }, setToken, setUser);
      return { ...response, user: resolvedUser };
    }
    return response;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    localStorage.removeItem('gf_user');
    for (const key of OLD_TOKEN_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    setUser(null);
    setToken(null);
  }, []);

  const setActiveRole = useCallback((slug: string) => {
    localStorage.setItem(ACTIVE_ROLE_KEY, slug);
    setUser((current) => current ? { ...current, activeRole: slug } : current);
  }, []);

  const hasRole = useCallback((slug: string): boolean => {
    return approvedOf(user).some((role) => role.slug === slug) || (user?.roles.some((role) => role.slug === slug) ?? false);
  }, [user]);

  const hasApprovedRole = useCallback((slug: string): boolean => {
    return approvedOf(user).some((role) => role.slug === slug);
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(withResolvedActiveRole(userData));
    } catch {
      // Keep the current session if a transient refresh request fails.
    }
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    setActiveRole,
    hasRole,
    hasApprovedRole,
    approvedRoles,
    pendingRoles,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
