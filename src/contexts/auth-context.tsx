"use client";
import { createContext, useCallback, useEffect, useState } from "react";
import type { User, AuthStatus, LoginCredentials, AuthState } from "@/types/auth";
import { apiClient } from "@/lib/api-client";

interface AuthContextType {
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthStatus>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "portaria-auth";
const AUTH_COOKIE = "portaria-auth-status";

function setAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
}

function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Strict`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("unauthenticated");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function validateSession() {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) { setIsLoading(false); return; }
      try {
        const state: AuthState = JSON.parse(stored);
        if (!state.token) { localStorage.removeItem(AUTH_STORAGE_KEY); setIsLoading(false); return; }
        // For now, trust the stored user (backend doesn't have /me endpoint yet)
        setUser(state.user);
        setStatus("authenticated");
        setAuthCookie();
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        clearAuthCookie();
      } finally {
        setIsLoading(false);
      }
    }
    validateSession();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthStatus> => {
    const result = await apiClient.post<{ token: string; user: { id: string; name: string; email: string; role: string; condominium_id: string | null; first_access: boolean } }>("/api/auth/login", credentials);
    const u: User = {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role as User["role"],
      condominium_id: result.user.condominium_id ?? undefined,
      first_access: result.user.first_access,
    };
    setUser(u);
    setStatus("authenticated");
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: u, token: result.token, status: "authenticated" }));
    setAuthCookie();
    return "authenticated";
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setStatus("unauthenticated");
    localStorage.removeItem(AUTH_STORAGE_KEY);
    clearAuthCookie();
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
