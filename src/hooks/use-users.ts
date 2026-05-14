"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { User } from "@/types/user";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => apiClient.get<User[]>("/api/users"),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string; role: string; condominium_id?: string }) =>
      apiClient.post<User & { temp_password: string }>("/api/users", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      apiClient.put<User>(`/api/users/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); },
  });
}
