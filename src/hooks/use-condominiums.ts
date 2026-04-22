"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Condominium } from "@/types/condominium";
import type { CondominiumFormData } from "@/schemas/condominium.schema";

export function useCondominiums() {
  return useQuery({
    queryKey: ["condominiums"],
    queryFn: () => apiClient.get<Condominium[]>("/api/condominiums"),
  });
}

export function useCondominium(id: string) {
  return useQuery({
    queryKey: ["condominiums", id],
    queryFn: () => apiClient.get<Condominium>(`/api/condominiums/${id}`),
    enabled: !!id,
  });
}

export function useCreateCondominium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CondominiumFormData) => apiClient.post<Condominium>("/api/condominiums", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["condominiums"] }); },
  });
}

export function useUpdateCondominium(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CondominiumFormData>) => apiClient.put<Condominium>(`/api/condominiums/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["condominiums"] }); qc.invalidateQueries({ queryKey: ["condominiums", id] }); },
  });
}

export function useDeleteCondominium() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/condominiums/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["condominiums"] }); },
  });
}
