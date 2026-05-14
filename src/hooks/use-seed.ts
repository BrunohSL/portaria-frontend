"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export function useSeedDatabase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ condominium: number; units: number; contacts: number }>("/api/dev/seed"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["condominiums"] });
      qc.invalidateQueries({ queryKey: ["units"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
