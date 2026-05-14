"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Gate {
  id: string;
  condominium_id: string;
  slug: string;
  label: string;
  dns: string | null;
  brand: string | null;
  extension: string | null;
  position: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type GateInput = Partial<Omit<Gate, "id" | "condominium_id" | "created_at" | "updated_at">>;

export function useGates(condominiumId: string) {
  return useQuery({
    queryKey: ["gates", condominiumId],
    queryFn: () => apiClient.get<Gate[]>(`/api/condominiums/${condominiumId}/gates`),
    enabled: !!condominiumId,
  });
}

export function useCreateGate(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GateInput) => apiClient.post<Gate>(`/api/condominiums/${condominiumId}/gates`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gates", condominiumId] }),
  });
}

export function useUpdateGate(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ gateId, data }: { gateId: string; data: GateInput }) =>
      apiClient.put<Gate>(`/api/condominiums/${condominiumId}/gates/${gateId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gates", condominiumId] }),
  });
}

export function useDeleteGate(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (gateId: string) => apiClient.delete(`/api/condominiums/${condominiumId}/gates/${gateId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gates", condominiumId] }),
  });
}
