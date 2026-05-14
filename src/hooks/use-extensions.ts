"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Extension {
  id: string;
  condominium_id: string;
  name: string;
  number: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type ExtensionInput = Partial<Omit<Extension, "id" | "condominium_id" | "created_at" | "updated_at">>;

export function useExtensions(condominiumId: string) {
  return useQuery({
    queryKey: ["extensions", condominiumId],
    queryFn: () => apiClient.get<Extension[]>(`/api/condominiums/${condominiumId}/extensions`),
    enabled: !!condominiumId,
  });
}

export function useCreateExtension(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExtensionInput) =>
      apiClient.post<Extension>(`/api/condominiums/${condominiumId}/extensions`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["extensions", condominiumId] }),
  });
}

export function useUpdateExtension(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ extensionId, data }: { extensionId: string; data: ExtensionInput }) =>
      apiClient.put<Extension>(`/api/condominiums/${condominiumId}/extensions/${extensionId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["extensions", condominiumId] }),
  });
}

export function useDeleteExtension(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (extensionId: string) =>
      apiClient.delete(`/api/condominiums/${condominiumId}/extensions/${extensionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["extensions", condominiumId] }),
  });
}
