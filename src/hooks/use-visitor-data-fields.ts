"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface VisitorDataField {
  id: string;
  key: string;
  label: string;
  description: string | null;
  active: boolean;
  sort_order: number;
}

export function useVisitorDataFields() {
  return useQuery({
    queryKey: ["visitor-data-fields"],
    queryFn: () => apiClient.get<VisitorDataField[]>("/api/visitor-data-fields"),
    staleTime: 5 * 60 * 1000,
  });
}
