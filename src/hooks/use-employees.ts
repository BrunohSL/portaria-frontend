"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Employee, EmployeeRole } from "@/types/employee";

export function useEmployees(condominiumId: string) {
  return useQuery({
    queryKey: ["employees", condominiumId],
    queryFn: () => apiClient.get<Employee[]>(`/api/condominiums/${condominiumId}/employees`),
    enabled: !!condominiumId,
  });
}

export function useCreateEmployee(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; phone?: string; role_id: string; can_authorize_access?: boolean; emergency_active?: boolean; emergency_phone?: string | null }) =>
      apiClient.post<Employee>(`/api/condominiums/${condominiumId}/employees`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", condominiumId] }); },
  });
}

export function useUpdateEmployee(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: Partial<Employee> }) =>
      apiClient.put<Employee>(`/api/condominiums/${condominiumId}/employees/${employeeId}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", condominiumId] }); },
  });
}

export function useDeleteEmployee(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => apiClient.delete(`/api/condominiums/${condominiumId}/employees/${employeeId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", condominiumId] }); },
  });
}

export function useEmployeeRoles() {
  return useQuery({
    queryKey: ["employee-roles"],
    queryFn: () => apiClient.get<EmployeeRole[]>("/api/employee-roles"),
    staleTime: 10 * 60 * 1000, // 10min — cargos quase nao mudam
  });
}

export function useBatchUpdateEmployees(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (employees: { id: string; name?: string; phone?: string | null; role_id?: string; can_authorize_access?: boolean; emergency_active?: boolean; emergency_phone?: string | null; active?: boolean }[]) =>
      apiClient.put<{ updated: number }>(`/api/condominiums/${condominiumId}/employees/batch`, { employees }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", condominiumId] }); },
  });
}

export function useImportEmployees(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: { name: string; phone?: string; role: string; can_authorize_access?: string }[]) =>
      apiClient.post<{ created: number; errors: { line: number; reason: string }[] }>(`/api/condominiums/${condominiumId}/employees/import`, { rows }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees", condominiumId] }); },
  });
}
