"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface UnitIdentificationLevel {
  key: string;
  label: string;
  description: string | null;
  sort_order: number;
}

export function useUnitIdentificationLevels() {
  return useQuery({
    queryKey: ["unit-identification-levels"],
    queryFn: () => apiClient.get<UnitIdentificationLevel[]>("/api/catalogs/unit-identification-levels"),
    staleTime: 5 * 60 * 1000,
  });
}
