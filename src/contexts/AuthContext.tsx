import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi, type AuthUser, type UserRole, type RegisterData } from '../services/authApi';

// ─── Types ──────────────────────────────────────────────────────────

export type { UserRole, AuthUser };

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
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  setActiveRole: (slug: string) => void;
  hasRole: (slug: string) => boolean;
  hasApprovedRole: (slug: string) => boolean;
  approvedRoles: UserRole[];
  refreshUser: () => Promise<void>;
}

// ─── Constants ──────────────────────────────────────────────────────

const TOKEN_KEY = 'svp_token';
const ACTIVE_ROLE_KEY = 'svp_active_role';
const OLD_TOKEN_KEYS = ['gf_token', 'gf_admin_token'];

// ─── Context ────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ────────────────────────────────────────────────────────

function migrateToken(): string | null {
  // Check for existing token first
  const existing = localStorage.getItem(TOKEN_KEY);
  if (existing) return existing;

  // Migrate from old keys
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

// ─── Role dashboard paths ───────────────────────────────────────────

export function getRoleDashboardPath(roleSlug: string): string {
  const map: Record<string, string> = {
    admin: '/quan-tri',
    giam_doc: '/quan-tri',
    truong_phong: '/quan-tri',
    chuyen_gia: '/chuyen-gia',
    chuyen_vien: '/chuyen-vien',
    ctv_khach: '/ctv',
    ctv_nguon: '/ctv',
    chu_nha: '/chu-nha',
    khach_mua: '/khach-mua',
    nguoi_gioi_thieu: '/gioi-thieu',
    doi_tac: '/gioi-thieu',
    ho_tro: '/quan-tri',
  };
  return map[roleSlug] || '/';
}

// ─── Role Vietnamese names ──────────────────────────────────────────

export const ROLE_NAMES: Record<string, string> = {
  admin: 'Quản trị viên',
  giam_doc: 'Giám đốc khu vực',
  truong_phong: 'Trưởng phòng',
  chuyen_gia: 'Chuyên gia / Đầu chủ',
  chuyen_vien: 'Chuyên viên / Đầu khách',
  ctv_khach: 'CTV tìm khách',
  ctv_nguon: 'CTV tìm nguồn',
  chu_nha: 'Chủ nhà',
  khach_mua: 'Khách mua',
  nguoi_gioi_thieu: 'Người giới thiệu',
  doi_tac: 'Đối tác',
  ho_tro: 'Hỗ trợ',
};

// ─── Provider ───────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: check for stored token and validate
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
        setUser(userData);

        // Restore active role
        const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY);
        if (savedRole && userData.roles.some(r => r.slug === savedRole)) {
          userData.activeRole = savedRole;
        } else if (userData.roles.length > 0) {
          // Default to first approved role
          const firstApproved = userData.roles.find(r => r.status === 'approved');
          if (firstApproved) {
            userData.activeRole = firstApproved.slug;
            localStorage.setItem(ACTIVE_ROLE_KEY, firstApproved.slug);
          }
        }
        setUser({ ...userData });
      } catch {
        // Token invalid
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      }

      setIsLoading(false);
    };

    init();
  }, []);

  const approvedRoles = user?.roles.filter(r => r.status === 'approved') ?? [];

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await authApi.login(email, password);
      const { token: newToken, user: userData } = response;

      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);
      setUser(userData);

      const approved = userData.roles.filter(r => r.status === 'approved');

      // Set active role
      if (approved.length === 1) {
        userData.activeRole = approved[0].slug;
        localStorage.setItem(ACTIVE_ROLE_KEY, approved[0].slug);
      }

      setUser({ ...userData });

      return { success: true, user: userData, approvedRoles: approved };
    } catch (err: any) {
      // 403 = pending approval
      if (err.status === 403) {
        return {
          success: false,
          error: 'pending',
          user: err.data?.user,
        };
      }
      return {
        success: false,
        error: err.message || 'Đăng nhập thất bại. Vui lòng thử lại.',
      };
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<void> => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    // Clean up old keys too
    for (const key of OLD_TOKEN_KEYS) {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    }
    localStorage.removeItem('gf_user');
    setUser(null);
    setToken(null);
  }, []);

  const setActiveRole = useCallback((slug: string) => {
    localStorage.setItem(ACTIVE_ROLE_KEY, slug);
    if (user) {
      setUser({ ...user, activeRole: slug });
    }
  }, [user]);

  const hasRole = useCallback((slug: string): boolean => {
    return user?.roles.some(r => r.slug === slug) ?? false;
  }, [user]);

  const hasApprovedRole = useCallback((slug: string): boolean => {
    return user?.roles.some(r => r.slug === slug && r.status === 'approved') ?? false;
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      const savedRole = localStorage.getItem(ACTIVE_ROLE_KEY);
      if (savedRole && userData.roles.some(r => r.slug === savedRole)) {
        userData.activeRole = savedRole;
      }
      setUser(userData);
    } catch {
      // Silent fail
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
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
