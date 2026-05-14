"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Contact } from "@/types/condominium";

export function useContacts(condominiumId: string, filters?: { unit_id?: string; type?: string }) {
  const params = new URLSearchParams();
  if (filters?.unit_id) params.set("unit_id", filters.unit_id);
  if (filters?.type) params.set("type", filters.type);
  const qs = params.toString();
  const path = qs ? `/api/condominiums/${condominiumId}/contacts?${qs}` : `/api/condominiums/${condominiumId}/contacts`;
  return useQuery({
    queryKey: ["contacts", condominiumId, filters],
    queryFn: () => apiClient.get<Contact[]>(path),
    enabled: !!condominiumId,
  });
}

export function useCreateContact(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Contact>) => apiClient.post<Contact>(`/api/condominiums/${condominiumId}/contacts`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts", condominiumId] }); },
  });
}

export function useDeleteContact(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/condominiums/${condominiumId}/contacts/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts", condominiumId] }); },
  });
}

export function useBatchCreateContacts(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contacts: { name: string; unit_id: string; type: string; phone?: string }[]) =>
      apiClient.post<{ created: number; errors: { index: number; reason: string }[] }>(`/api/condominiums/${condominiumId}/contacts/batch`, { contacts }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts", condominiumId] }); qc.invalidateQueries({ queryKey: ["units", condominiumId] }); },
  });
}

export function useBatchUpdateContacts(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contacts: { id: string; name?: string; unit_id?: string; type?: string; phone?: string }[]) =>
      apiClient.put<{ updated: number }>(`/api/condominiums/${condominiumId}/contacts/batch`, { contacts }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts", condominiumId] }); },
  });
}

export function useImportContacts(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: { level1_value: string; level2_value: string; name: string; phone?: string; type: string }[]) =>
      apiClient.post<{ created: number; errors: { line: number; reason: string }[] }>(`/api/condominiums/${condominiumId}/contacts/import`, { rows }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contacts", condominiumId] }); },
  });
}
