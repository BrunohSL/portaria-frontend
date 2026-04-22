"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Flow, FlowStep } from "@/types/flow";

export function useFlows(condominiumId: string) {
  return useQuery({
    queryKey: ["flows", condominiumId],
    queryFn: () => apiClient.get<Flow[]>(`/api/condominiums/${condominiumId}/flows`),
    enabled: !!condominiumId,
  });
}

export function useFlow(condominiumId: string, flowId: string) {
  return useQuery({
    queryKey: ["flows", condominiumId, flowId],
    queryFn: () => apiClient.get<Flow>(`/api/condominiums/${condominiumId}/flows/${flowId}`),
    enabled: !!condominiumId && !!flowId,
  });
}

export function useCreateFlow(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; type: string }) => apiClient.post<Flow>(`/api/condominiums/${condominiumId}/flows`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["flows", condominiumId] }); },
  });
}

export function useDeleteFlow(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flowId: string) => apiClient.delete(`/api/condominiums/${condominiumId}/flows/${flowId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["flows", condominiumId] }); },
  });
}

export function useFlowSteps(condominiumId: string, flowId: string) {
  return useQuery({
    queryKey: ["flow-steps", condominiumId, flowId],
    queryFn: () => apiClient.get<FlowStep[]>(`/api/condominiums/${condominiumId}/flows/${flowId}/steps`),
    enabled: !!condominiumId && !!flowId,
  });
}

export function useCreateFlowStep(condominiumId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FlowStep>) => apiClient.post<FlowStep>(`/api/condominiums/${condominiumId}/flows/${flowId}/steps`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["flow-steps", condominiumId, flowId] }); qc.invalidateQueries({ queryKey: ["flows", condominiumId, flowId] }); },
  });
}

export function useDeleteFlowStep(condominiumId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => apiClient.delete(`/api/condominiums/${condominiumId}/flows/${flowId}/steps/${stepId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["flow-steps", condominiumId, flowId] }); },
  });
}
