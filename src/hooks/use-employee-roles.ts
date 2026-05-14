"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface EmployeeRole {
  id: string;
  key: string;
  label: string;
  active: boolean;
}

export function useEmployeeRolesForCondominium(condominiumId: string) {
  return useQuery({
    queryKey: ["employee-roles", condominiumId],
    queryFn: () =>
      apiClient.get<EmployeeRole[]>(`/api/condominiums/${condominiumId}/employee-roles`),
    enabled: !!condominiumId,
  });
}
