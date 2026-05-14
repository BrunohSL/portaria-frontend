export interface EmployeeRole {
  id: string;
  key: string;
  label: string;
  active: boolean;
}

export type ShiftType = "WEEKLY" | "ROTATION";

export interface EmployeeShift {
  id: string;
  employee_id: string;
  type: ShiftType;
  start_time: string;
  end_time: string;
  days_of_week?: number[];
  rotation_start_date?: string;
  rotation_period_days?: number;
}

export interface Employee {
  id: string;
  condominium_id: string;
  role_id: string;
  name: string;
  phone?: string;
  can_authorize_access: boolean;
  emergency_active: boolean;
  emergency_phone?: string;
  active: boolean;
  role?: EmployeeRole;
  shifts?: EmployeeShift[];
  created_at: string;
}
