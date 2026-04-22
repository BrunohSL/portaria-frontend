"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Resident } from "@/types/condominium";

export function useResidents(condominiumId: string, filters?: { unit_id?: string; type?: string }) {
  const params = new URLSearchParams();
  if (filters?.unit_id) params.set("unit_id", filters.unit_id);
  if (filters?.type) params.set("type", filters.type);
  const qs = params.toString();
  return useQuery({
    queryKey: ["residents", condominiumId, filters],
    queryFn: () => apiClient.get<Resident[]>(`/api/condominiums/${condominiumId}/residents${qs ? `?${qs}` : ""}`),
    enabled: !!condominiumId,
  });
}

export function useCreateResident(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Resident>) => apiClient.post<Resident>(`/api/condominiums/${condominiumId}/residents`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["residents", condominiumId] }); },
  });
}

export function useUpdateResident(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ residentId, data }: { residentId: string; data: Partial<Resident> }) => apiClient.put<Resident>(`/api/condominiums/${condominiumId}/residents/${residentId}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["residents", condominiumId] }); },
  });
}

export function useDeleteResident(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (residentId: string) => apiClient.delete(`/api/condominiums/${condominiumId}/residents/${residentId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["residents", condominiumId] }); },
  });
}
