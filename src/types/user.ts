export type UserRole = "ADM" | "CLIENT_ADM" | "SUPPORT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  condominium_id?: string;
  active: boolean;
  first_access: boolean;
  condominium?: { id: string; name: string };
  created_at: string;
}
