"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Flow, FlowNode, FlowEdge, FlowValidationResult, NodeType } from "@/types/flow";

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
    mutationFn: (data: { name: string; type: string }) =>
      apiClient.post<Flow>(`/api/condominiums/${condominiumId}/flows`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows", condominiumId] });
    },
  });
}

export function useUpdateFlow(condominiumId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Flow>) =>
      apiClient.put<Flow>(`/api/condominiums/${condominiumId}/flows/${flowId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows", condominiumId] });
      qc.invalidateQueries({ queryKey: ["flows", condominiumId, flowId] });
    },
  });
}

export function useDeleteFlow(condominiumId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (flowId: string) =>
      apiClient.delete(`/api/condominiums/${condominiumId}/flows/${flowId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows", condominiumId] });
    },
  });
}

// ======================
// Nodes
// ======================

export function useFlowNodes(condominiumId: string, flowId: string) {
  return useQuery({
    queryKey: ["flow-nodes", condominiumId, flowId],
    queryFn: () => apiClient.get<FlowNode[]>(`/api/condominiums/${condominiumId}/flows/${flowId}/nodes`),
    enabled: !!condominiumId && !!flowId,
  });
}

export function useCreateFlowNode(condominiumId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: NodeType; config?: Record<string, unknown>; position_x?: number; position_y?: number }) =>
      apiClient.post<FlowNode>(`/api/condominiums/${condominiumId}/flows/${flowId}/nodes`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow-nodes", condominiumId, flowId] });
      qc.invalidateQueries({ queryKey: ["flows", condominiumId, flowId] });
    },
  });
}

export function useUpdateFlowNode(condominiumId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ nodeId, data }: { nodeId: string; data: Partial<FlowNode> }) =>
      apiClient.put<FlowNode>(`/api/condominiums/${condominiumId}/flows/${flowId}/nodes/${nodeId}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow-nodes", condominiumId, flowId] });
      qc.invalidateQueries({ queryKey: ["flows", condominiumId, flowId] });
    },
  });
}

export function useDeleteFlowNode(condominiumId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) =>
      apiClient.delete(`/api/condominiums/${condominiumId}/flows/${flowId}/nodes/${nodeId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flow-nodes", condominiumId, flowId] });
      qc.invalidateQueries({ queryKey: ["flows", condominiumId, flowId] });
    },
  });
}

// ======================
// Edges
// ======================

export function useCreateFlowEdge(condominiumId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      source_node_id: string;
      source_handle?: string;
      target_node_id: string;
      target_handle?: string;
    }) => apiClient.post<FlowEdge>(`/api/condominiums/${condominiumId}/flows/${flowId}/edges`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows", condominiumId, flowId] });
    },
  });
}

export function useDeleteFlowEdge(condominiumId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (edgeId: string) =>
      apiClient.delete(`/api/condominiums/${condominiumId}/flows/${flowId}/edges/${edgeId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows", condominiumId, flowId] });
    },
  });
}

// ======================
// Misc
// ======================

export function useValidateFlow(condominiumId: string, flowId: string) {
  return useQuery({
    queryKey: ["flow-validation", condominiumId, flowId],
    queryFn: () =>
      apiClient.get<FlowValidationResult>(`/api/condominiums/${condominiumId}/flows/${flowId}/validate`),
    enabled: !!condominiumId && !!flowId,
  });
}

export function useSetEntryNode(condominiumId: string, flowId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (nodeId: string) =>
      apiClient.put<Flow>(`/api/condominiums/${condominiumId}/flows/${flowId}/entry-node`, { nodeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flows", condominiumId, flowId] });
    },
  });
}
