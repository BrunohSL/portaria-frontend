export type UserRole = "ADM" | "CLIENT_ADM" | "SUPPORT";
export type AuthStatus = "authenticated" | "unauthenticated";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  condominium_id?: string;
  first_access: boolean;
}

export interface AuthState {
  user: User;
  token: string;
  status: AuthStatus;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
