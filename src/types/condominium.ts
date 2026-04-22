export interface Condominium {
  id: string;
  name: string;
  cnpj?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  active: boolean;
  twilio_phone_number?: string;
  fallback_extension?: string;
  gates_config: Record<string, { dns: string; label: string }>;
  extensions_config: Record<string, string>;
  level1_label: string;
  level2_label: string;
  created_at: string;
  updated_at: string;
  units?: Unit[];
}

export interface Unit {
  id: string;
  condominium_id: string;
  level1_value: string;
  level2_value: string;
  status: "occupied" | "vacant";
  residents?: Resident[];
  created_at: string;
}

export interface Resident {
  id: string;
  condominium_id: string;
  unit_id?: string;
  name: string;
  cpf?: string;
  phone?: string;
  phone_2?: string;
  email?: string;
  type: "owner" | "tenant" | "dependent";
  active: boolean;
  can_authorize: boolean;
  notes?: string;
  unit?: { id: string; level1_value: string; level2_value: string };
  created_at: string;
}
