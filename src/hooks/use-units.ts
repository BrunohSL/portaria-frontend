"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Unit } from "@/types/condominium";

export function useUnits(condominiumId: string) {
  return useQuery({
    queryKey: ["units", condominiumId],
    queryFn: () => apiClient.get<Unit[]>(`/api/condominiums/${condominiumId}/units`),
    enabled: !!condominiumId,
  });
}

export function useCreateUnit(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { level1_value: string; level2_value: string }) => apiClient.post<Unit>(`/api/condominiums/${condominiumId}/units`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["units", condominiumId] }); qc.invalidateQueries({ queryKey: ["condominiums", condominiumId] }); },
  });
}

export function useUpdateUnit(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, data }: { unitId: string; data: Partial<Unit> }) => apiClient.put<Unit>(`/api/condominiums/${condominiumId}/units/${unitId}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["units", condominiumId] }); },
  });
}

export function useDeleteUnit(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (unitId: string) => apiClient.delete(`/api/condominiums/${condominiumId}/units/${unitId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["units", condominiumId] }); qc.invalidateQueries({ queryKey: ["condominiums", condominiumId] }); },
  });
}

export function useBatchUpdateUnits(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (units: { id: string; level1_value?: string; level2_value?: string }[]) =>
      apiClient.put<{ updated: number }>(`/api/condominiums/${condominiumId}/units/batch`, { units }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["units", condominiumId] }); },
  });
}

export function useImportUnits(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: { level1_value: string; level2_value: string }[]) =>
      apiClient.post<{ created: number; errors: { line: number; reason: string }[] }>(`/api/condominiums/${condominiumId}/units/import`, { rows }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["units", condominiumId] }); qc.invalidateQueries({ queryKey: ["condominiums", condominiumId] }); },
  });
}
