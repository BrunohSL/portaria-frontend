"use client";
import { use, useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { ArrowLeft, Save, AlertCircle, Check, Play, ChevronDown } from "lucide-react";
import { toast } from "sonner";

import {
  useFlow,
  useCreateFlowNode,
  useUpdateFlowNode,
  useDeleteFlowNode,
  useCreateFlowEdge,
  useDeleteFlowEdge,
  useSetEntryNode,
  useValidateFlow,
} from "@/hooks/use-flows";
import type { NodeType } from "@/types/flow";
import { NODE_REGISTRY, getOutputHandleColor } from "@/lib/node-registry";
import { Button } from "@/components/ui/button";

import { EditorCanvas } from "@/components/flow-editor/editor-canvas";
import { ConfigPanel } from "@/components/flow-editor/config-panel";
import { NodePalette } from "@/components/flow-editor/node-palette";
import type { FlowNodeData } from "@/components/flow-editor/flow-node";

type RFNode = Node<FlowNodeData>;
type RFEdge = Edge;

const NODE_W = 240;
const NODE_H = 140;
const GAP = 30;

function defaultConfigFor(type: NodeType): Record<string, unknown> {
  switch (type) {
    case "TIMER": return { durationSeconds: 30 };
    case "COMUNICACAO": return { mode: "tts", text: "" };
    case "COMANDO": return { command: "open_gate" };
    case "COLETAR_DADOS_MORADOR":
    case "COLETAR_DADOS_VISITA": return { requestedFields: [], promptText: "" };
    case "CONTATAR": return { target: "morador", channel: "interfone", timeoutSeconds: 30 };
    case "END": return { behavior: "hangup", message: "" };
    case "COLETAR_INTENCAO": return { catalogKey: "o_que_deseja", promptText: "" };
    case "TRANSFERIR_FLUXO": return { targetFlowId: null };
  }
}

let tmpCounter = 0;
function newTmpId() {
  tmpCounter += 1;
  return `tmp_${Date.now()}_${tmpCounter}`;
}

function buildRFNode(
  id: string,
  type: NodeType,
  position: { x: number; y: number },
  config: Record<string, unknown>,
  opts: { isEntry?: boolean; branchLabel?: string } = {}
): RFNode {
  return {
    id,
    type: "flowNode",
    position,
    data: {
      type,
      config,
      isEntry: opts.isEntry,
      branchLabel: opts.branchLabel,
    },
  };
}

function edgeStyle(sourceHandle: string) {
  const color = getOutputHandleColor(sourceHandle);
  return { stroke: color, strokeWidth: 2, strokeOpacity: 0.75 };
}

interface ValidationError {
  code: string;
  message: string;
  nodeId?: string;
  handle?: string;
}

function ValidationErrorsBadge({ errors, nodes, onSelectNode }: { errors: ValidationError[]; nodes: RFNode[]; onSelectNode: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-validation-popover]")) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  function nodeLabel(nodeId: string | undefined): string {
    if (!nodeId) return "—";
    const n = nodes.find((x) => x.id === nodeId);
    if (!n) return `#${nodeId}`;
    const def = NODE_REGISTRY[n.data.type];
    return def?.label ?? n.data.type;
  }

  return (
    <div className="relative" data-validation-popover>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1 hover:bg-red-500/20 transition-colors"
      >
        <AlertCircle className="size-3" />
        {errors.length} erro(s)
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-80 max-h-80 overflow-y-auto bg-card border border-border rounded-lg shadow-lg">
          <div className="p-2 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
            {errors.length} validação(ões) pendente(s)
          </div>
          <ul className="p-1">
            {errors.map((err, i) => (
              <li key={`${err.code}-${err.nodeId ?? "global"}-${err.handle ?? i}`}>
                <button
                  className="w-full text-left p-2 rounded hover:bg-muted text-[11px] transition-colors disabled:cursor-default disabled:hover:bg-transparent"
                  disabled={!err.nodeId}
                  onClick={() => {
                    if (err.nodeId) {
                      onSelectNode(err.nodeId);
                      setOpen(false);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-3 text-red-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{nodeLabel(err.nodeId)}{err.handle && <span className="text-muted-foreground"> · {err.handle}</span>}</div>
                      <div className="text-muted-foreground">{err.message}</div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function FluxoEditorPage({ params }: { params: Promise<{ id: string; flowId: string }> }) {
  return (
    <ReactFlowProvider>
      <FluxoEditorInner params={params} />
    </ReactFlowProvider>
  );
}

function FluxoEditorInner({ params }: { params: Promise<{ id: string; flowId: string }> }) {
  const { id: condominiumId, flowId } = use(params);
  const { data: flow, isLoading, refetch } = useFlow(condominiumId, flowId);
  const validateQuery = useValidateFlow(condominiumId, flowId);

  const createNode = useCreateFlowNode(condominiumId, flowId);
  const updateNode = useUpdateFlowNode(condominiumId, flowId);
  const deleteNode = useDeleteFlowNode(condominiumId, flowId);
  const createEdge = useCreateFlowEdge(condominiumId, flowId);
  const deleteEdge = useDeleteFlowEdge(condominiumId, flowId);
  const setEntryNode = useSetEntryNode(condominiumId, flowId);

  const [rfNodes, setRfNodes, onRfNodesChange] = useNodesState<RFNode>([]);
  const [rfEdges, setRfEdges, onRfEdgesChange] = useEdgesState<RFEdge>([]);
  const [entryNodeId, setEntryNodeIdLocal] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [serverSnapshot, setServerSnapshot] = useState<{
    nodes: Record<string, { type: NodeType; config: Record<string, unknown>; position_x: number | null; position_y: number | null }>;
    edges: Record<string, { source: string; sourceHandle: string; target: string; targetHandle: string }>;
    entryNodeId: string | null;
  }>({ nodes: {}, edges: {}, entryNodeId: null });
  const [saving, setSaving] = useState(false);

  // ============================
  // Carrega do servidor
  // ============================
  useEffect(() => {
    if (!flow) return;
    const apiNodes = flow.nodes ?? [];
    const apiEdges = flow.edges ?? [];

    const newRfNodes: RFNode[] = apiNodes.map((n) =>
      buildRFNode(
        String(n.id),
        n.type,
        { x: n.position_x ?? 0, y: n.position_y ?? 0 },
        n.config ?? {},
        {
          isEntry: String(n.id) === String(flow.entry_node_id ?? ""),
          branchLabel: (n.config as Record<string, unknown>)?._branchLabel as string | undefined,
        }
      )
    );

    const newRfEdges: RFEdge[] = apiEdges.map((e) => ({
      id: String(e.id),
      source: String(e.source_node_id),
      sourceHandle: e.source_handle,
      target: String(e.target_node_id),
      targetHandle: e.target_handle,
      style: edgeStyle(e.source_handle),
    }));

    setRfNodes(newRfNodes);
    setRfEdges(newRfEdges);
    setEntryNodeIdLocal(flow.entry_node_id ? String(flow.entry_node_id) : null);

    // snapshot pra diff
    const nodeSnap: typeof serverSnapshot.nodes = {};
    apiNodes.forEach((n) => {
      nodeSnap[String(n.id)] = {
        type: n.type,
        config: n.config ?? {},
        position_x: n.position_x,
        position_y: n.position_y,
      };
    });
    const edgeSnap: typeof serverSnapshot.edges = {};
    apiEdges.forEach((e) => {
      edgeSnap[String(e.id)] = {
        source: String(e.source_node_id),
        sourceHandle: e.source_handle,
        target: String(e.target_node_id),
        targetHandle: e.target_handle,
      };
    });
    setServerSnapshot({
      nodes: nodeSnap,
      edges: edgeSnap,
      entryNodeId: flow.entry_node_id ? String(flow.entry_node_id) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flow]);

  // ============================
  // Dirty
  // ============================
  const isDirty = useMemo(() => {
    if (entryNodeId !== serverSnapshot.entryNodeId) return true;

    // Nodes
    const localIds = new Set(rfNodes.map((n) => n.id));
    const serverIds = new Set(Object.keys(serverSnapshot.nodes));
    if (localIds.size !== serverIds.size) return true;
    for (const id of localIds) {
      if (id.startsWith("tmp_")) return true;
      const local = rfNodes.find((n) => n.id === id)!;
      const server = serverSnapshot.nodes[id];
      if (!server) return true;
      if (local.data.type !== server.type) return true;
      if (JSON.stringify(local.data.config) !== JSON.stringify(server.config)) return true;
      if (local.position.x !== (server.position_x ?? 0)) return true;
      if (local.position.y !== (server.position_y ?? 0)) return true;
    }
    for (const id of serverIds) if (!localIds.has(id)) return true;

    // Edges
    const localEdgeKeys = new Set(rfEdges.map((e) => `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`));
    const serverEdgeKeys = new Set(
      Object.values(serverSnapshot.edges).map((e) => `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`)
    );
    if (localEdgeKeys.size !== serverEdgeKeys.size) return true;
    for (const k of localEdgeKeys) if (!serverEdgeKeys.has(k)) return true;

    return false;
  }, [rfNodes, rfEdges, entryNodeId, serverSnapshot]);

  // ============================
  // Selected node info pra ConfigPanel
  // ============================
  const selectedNode = useMemo(() => {
    const n = rfNodes.find((x) => x.id === selectedId);
    if (!n) return null;
    return { id: n.id, type: n.data.type, config: n.data.config, isEntry: n.data.isEntry };
  }, [rfNodes, selectedId]);

  // ============================
  // Handlers
  // ============================
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => onRfNodesChange(changes as NodeChange<RFNode>[]),
    [onRfNodesChange]
  );
  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => onRfEdgesChange(changes),
    [onRfEdgesChange]
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      // Backend exige unicidade por (source_node_id, source_handle).
      // Removemos qualquer edge prévia da mesma origem antes de adicionar.
      const newEdge: RFEdge = {
        id: newTmpId(),
        source: connection.source!,
        sourceHandle: connection.sourceHandle ?? "default",
        target: connection.target!,
        targetHandle: connection.targetHandle ?? "default",
        style: edgeStyle(connection.sourceHandle ?? "default"),
      };
      setRfEdges((prev) => [
        ...prev.filter(
          (e) => !(e.source === connection.source && e.sourceHandle === connection.sourceHandle)
        ),
        newEdge,
      ]);
    },
    [setRfEdges]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setRfNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setRfEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedId === nodeId) setSelectedId(null);
      if (entryNodeId === nodeId) setEntryNodeIdLocal(null);
    },
    [setRfNodes, setRfEdges, selectedId, entryNodeId]
  );

  const handleSetEntry = useCallback(
    (nodeId: string) => {
      setEntryNodeIdLocal(nodeId);
      setRfNodes((prev) => prev.map((n) => ({ ...n, data: { ...n.data, isEntry: n.id === nodeId } })));
    },
    [setRfNodes]
  );

  const handleConfigChange = useCallback(
    (config: Record<string, unknown>) => {
      if (!selectedId) return;
      setRfNodes((prev) =>
        prev.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, config } } : n))
      );
    },
    [selectedId, setRfNodes]
  );

  // ============================
  // Adicionar node (com auto-spawn de filhos pra branched)
  // ============================
  const handleAddNode = useCallback(
    (type: NodeType) => {
      const def = NODE_REGISTRY[type];
      const requiredHandles = def.outputs.filter((o) => o.required).map((o) => o.handle);

      // Posição: à direita do último node, ou centro se vazio
      const maxX = rfNodes.length === 0 ? 100 : Math.max(...rfNodes.map((n) => n.position.x)) + NODE_W + GAP;
      const baseY = rfNodes.length === 0 ? 100 : Math.max(...rfNodes.map((n) => n.position.y));

      const parentId = newTmpId();
      const parentNode = buildRFNode(
        parentId,
        type,
        { x: maxX, y: baseY },
        defaultConfigFor(type)
      );

      const childNodes: RFNode[] = [];
      const childEdges: RFEdge[] = [];

      if (requiredHandles.length > 0) {
        const total = requiredHandles.length;
        const startY = baseY - ((total - 1) * (NODE_H + GAP)) / 2;
        for (let i = 0; i < total; i += 1) {
          const handle = requiredHandles[i];
          const childId = newTmpId();
          childNodes.push(
            buildRFNode(
              childId,
              "COMUNICACAO",
              { x: maxX + NODE_W + GAP, y: startY + i * (NODE_H + GAP) },
              { mode: "tts", text: "", _branchLabel: handle },
              { branchLabel: handle }
            )
          );
          childEdges.push({
            id: newTmpId(),
            source: parentId,
            sourceHandle: handle,
            target: childId,
            targetHandle: "default",
            style: edgeStyle(handle),
          });
        }
      }

      setRfNodes((prev) => [...prev, parentNode, ...childNodes]);
      setRfEdges((prev) => [...prev, ...childEdges]);
      setSelectedId(parentId);

      // Se for o primeiro node, setar como entry
      if (rfNodes.length === 0) setEntryNodeIdLocal(parentId);

      toast.success(`${def.label} adicionado${requiredHandles.length ? ` com ${requiredHandles.length} saída(s)` : ""}`);
    },
    [rfNodes, setRfNodes, setRfEdges]
  );

  // Injetar callbacks nos nodes
  const enrichedNodes: RFNode[] = useMemo(
    () =>
      rfNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isEntry: n.id === entryNodeId,
          onDelete: handleDeleteNode,
          onSetEntry: handleSetEntry,
        },
      })),
    [rfNodes, entryNodeId, handleDeleteNode, handleSetEntry]
  );

  // ============================
  // Save (diff-based)
  // ============================
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const localNodeIds = new Set(rfNodes.map((n) => n.id));

      // 1. Criar novos nodes (tmp_*) → mapeia tmp_id → server_id
      const idMap: Record<string, string> = {};
      for (const node of rfNodes) {
        if (!node.id.startsWith("tmp_")) continue;
        const created = await createNode.mutateAsync({
          type: node.data.type,
          config: node.data.config,
          position_x: node.position.x,
          position_y: node.position.y,
        });
        idMap[node.id] = String(created.id);
      }

      // 2. Atualizar nodes existentes que mudaram
      for (const node of rfNodes) {
        if (node.id.startsWith("tmp_")) continue;
        const server = serverSnapshot.nodes[node.id];
        if (!server) continue;
        const changedType = node.data.type !== server.type;
        const changedConfig = JSON.stringify(node.data.config) !== JSON.stringify(server.config);
        const changedPos = node.position.x !== (server.position_x ?? 0) || node.position.y !== (server.position_y ?? 0);
        if (changedType || changedConfig || changedPos) {
          await updateNode.mutateAsync({
            nodeId: node.id,
            data: {
              ...(changedType ? { type: node.data.type } : {}),
              ...(changedConfig ? { config: node.data.config } : {}),
              ...(changedPos ? { position_x: node.position.x, position_y: node.position.y } : {}),
            },
          });
        }
      }

      // 3. Deletar edges removidas
      const localEdgeKeys = new Set(
        rfEdges.map((e) => `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`)
      );
      for (const [serverEdgeId, e] of Object.entries(serverSnapshot.edges)) {
        const key = `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`;
        if (!localEdgeKeys.has(key)) {
          await deleteEdge.mutateAsync(serverEdgeId);
        }
      }

      // 4. Deletar nodes removidos
      for (const serverNodeId of Object.keys(serverSnapshot.nodes)) {
        if (!localNodeIds.has(serverNodeId)) {
          await deleteNode.mutateAsync(serverNodeId);
        }
      }

      // 5. Criar edges novas (resolvendo tmp ids)
      const serverEdgeKeys = new Set(
        Object.values(serverSnapshot.edges).map(
          (e) => `${e.source}:${e.sourceHandle}->${e.target}:${e.targetHandle}`
        )
      );
      for (const edge of rfEdges) {
        const sourceId = idMap[edge.source] ?? edge.source;
        const targetId = idMap[edge.target] ?? edge.target;
        const key = `${sourceId}:${edge.sourceHandle}->${targetId}:${edge.targetHandle}`;
        if (!serverEdgeKeys.has(key)) {
          await createEdge.mutateAsync({
            source_node_id: sourceId,
            source_handle: edge.sourceHandle ?? "default",
            target_node_id: targetId,
            target_handle: edge.targetHandle ?? "default",
          });
        }
      }

      // 6. Set entry node se mudou (resolvendo tmp_)
      const finalEntryId = entryNodeId ? idMap[entryNodeId] ?? entryNodeId : null;
      if (finalEntryId !== serverSnapshot.entryNodeId && finalEntryId) {
        await setEntryNode.mutateAsync(finalEntryId);
      }

      await refetch();
      await validateQuery.refetch();
      toast.success("Fluxo salvo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [rfNodes, rfEdges, serverSnapshot, entryNodeId, createNode, updateNode, deleteEdge, deleteNode, createEdge, setEntryNode, refetch, validateQuery]);

  if (isLoading) {
    return <div className="p-6 text-muted-foreground text-sm">Carregando…</div>;
  }
  if (!flow) {
    return <div className="p-6 text-muted-foreground text-sm">Fluxo não encontrado</div>;
  }

  const validation = validateQuery.data;
  const hasValidationErrors = validation && !validation.valid;

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <div className="h-12 shrink-0 bg-card border-b border-border flex items-center px-4 gap-3">
        <Link href={`/condominios/${condominiumId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-xs text-muted-foreground">Fluxos /</span>
          <span className="text-sm font-medium truncate">{flow.name}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${flow.active ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-muted text-muted-foreground"}`}>
            {flow.active ? "Ativo" : "Inativo"}
          </span>
          {isDirty && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-400" />
              Alterações não salvas
            </span>
          )}
          {!isDirty && Object.keys(serverSnapshot.nodes).length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
              <Check className="size-3" /> Salvo
            </span>
          )}
          {hasValidationErrors && (
            <ValidationErrorsBadge errors={validation.errors} nodes={rfNodes} onSelectNode={setSelectedId} />
          )}
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saving} size="sm">
          <Save className="size-4 mr-1" />
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </div>

      {/* Canvas + painel direito */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative" style={{ background: "#080a0f" }}>
          <NodePalette flowType={flow.type} onAddNode={handleAddNode} />
          <EditorCanvas
            nodes={enrichedNodes}
            edges={rfEdges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={setSelectedId}
          />
          {!entryNodeId && rfNodes.length > 0 && (
            <div className="absolute bottom-3 left-3 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-2 py-1 flex items-center gap-1.5">
              <Play className="size-3" />
              Defina um node como entrada do fluxo
            </div>
          )}
        </div>
        <div className="w-72 shrink-0 bg-card border-l border-border overflow-y-auto">
          <ConfigPanel
            condominiumId={condominiumId}
            selectedNode={selectedNode}
            onConfigChange={handleConfigChange}
          />
        </div>
      </div>
    </div>
  );
}
