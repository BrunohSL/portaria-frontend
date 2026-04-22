"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CallSession, CallLog } from "@/types/call";

export function useCallSessions(filters?: { condominium_id?: string; status?: string; from?: string; to?: string }) {
  const params = new URLSearchParams();
  if (filters?.condominium_id) params.set("condominium_id", filters.condominium_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.from) params.set("from", filters.from);
  if (filters?.to) params.set("to", filters.to);
  const qs = params.toString();
  return useQuery({
    queryKey: ["call-sessions", filters],
    queryFn: () => apiClient.get<CallSession[]>(`/api/calls/sessions${qs ? `?${qs}` : ""}`),
  });
}

export function useCallSession(id: string) {
  return useQuery({
    queryKey: ["call-sessions", id],
    queryFn: () => apiClient.get<CallSession>(`/api/calls/sessions/${id}`),
    enabled: !!id,
  });
}

export function useCallSessionLogs(id: string) {
  return useQuery({
    queryKey: ["call-session-logs", id],
    queryFn: () => apiClient.get<CallLog[]>(`/api/calls/sessions/${id}/logs`),
    enabled: !!id,
  });
}
