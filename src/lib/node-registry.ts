// Registry dos tipos de node (espelha src/constants/nodeTypes.js do backend portaria).
// Toda mudança aqui exige mudança correspondente no backend.

import type { NodeType } from "@/types/flow";
import type { FlowTypeKey } from "@/lib/flow-types";
import { getCatalogOutputs } from "@/lib/intent-catalogs";

export interface NodeOutputHandle {
  handle: string;
  label: string;
  required?: boolean;
}

export interface NodeTypeDefinition {
  label: string;
  description: string;
  /** Cor primária do node (border + stripe) */
  color: string;
  /** Background suave para o ícone */
  bg: string;
  /** Texto curto pro tipo (mostrado no node) */
  shortTag: string;
  outputs: NodeOutputHandle[];
  /** Se presente, o tipo só pode ser usado em fluxos cujo `type` esteja na lista. */
  restrictedToFlowType?: FlowTypeKey[];
  /** Se presente, deriva os outputs do node a partir da config. Sobrescreve `outputs`. */
  getDynamicOutputs?: (config: Record<string, unknown>) => NodeOutputHandle[];
}

export const NODE_REGISTRY: Record<NodeType, NodeTypeDefinition> = {
  TIMER: {
    label: "Timer",
    description: "Aguarda um intervalo antes de seguir",
    color: "#fb923c",
    bg: "rgba(251,146,60,.12)",
    shortTag: "espera",
    outputs: [{ handle: "default", label: "Próximo" }],
  },

  COMUNICACAO: {
    label: "Comunicação",
    description: "Fala com o visitante (TTS ou LLM)",
    color: "#5b6af8",
    bg: "rgba(91,106,248,.14)",
    shortTag: "mensagem",
    outputs: [{ handle: "default", label: "Próximo" }],
  },

  COMANDO: {
    label: "Comando",
    description: "Aciona um equipamento (ex: abrir portão)",
    color: "#f59e0b",
    bg: "rgba(245,158,11,.12)",
    shortTag: "ação",
    outputs: [{ handle: "default", label: "Próximo" }],
  },

  COLETAR_DADOS_MORADOR: {
    label: "Coletar dados do morador",
    description: "Coleta e busca o morador no condomínio",
    color: "#60a5fa",
    bg: "rgba(96,165,250,.12)",
    shortTag: "identifica morador",
    outputs: [
      { handle: "dadosConfirmados", label: "Dados confirmados", required: true },
      { handle: "dadosNaoConfirmados", label: "Dados não confirmados", required: true },
    ],
  },

  COLETAR_DADOS_VISITA: {
    label: "Coletar dados da visita",
    description: "Coleta dados do visitante/entregador",
    color: "#38bdf8",
    bg: "rgba(56,189,248,.12)",
    shortTag: "captura visita",
    outputs: [{ handle: "default", label: "Próximo" }],
  },

  CONTATAR: {
    label: "Contatar",
    description: "Aciona morador ou funcionário do condomínio",
    color: "#a78bfa",
    bg: "rgba(167,139,250,.12)",
    shortTag: "contato",
    outputs: [
      { handle: "autorizado", label: "Autorizado", required: true },
      { handle: "naoAutorizado", label: "Não autorizado", required: true },
      { handle: "semResposta", label: "Sem resposta", required: true },
    ],
  },

  END: {
    label: "Fim",
    description: "Encerra o fluxo (desliga, transfere ou só para)",
    color: "#ef4444",
    bg: "rgba(239,68,68,.12)",
    shortTag: "fim",
    outputs: [],
  },

  COLETAR_INTENCAO: {
    label: "Coletar intenção",
    description: "Identifica a intenção do visitante e roteia para o fluxo correto",
    color: "#f97316",
    bg: "rgba(249,115,22,.12)",
    shortTag: "router",
    outputs: [],
    restrictedToFlowType: ["ROOT"],
    getDynamicOutputs: (config) => getCatalogOutputs(config?.catalogKey as string | undefined),
  },

  TRANSFERIR_FLUXO: {
    label: "Transferir fluxo",
    description: "Encaminha a chamada para outro fluxo configurado",
    color: "#0ea5e9",
    bg: "rgba(14,165,233,.12)",
    shortTag: "transfer",
    outputs: [],
    restrictedToFlowType: ["ROOT"],
  },
};

export const NODE_TYPE_KEYS = Object.keys(NODE_REGISTRY) as NodeType[];

export function resolveOutputs(type: NodeType, config?: Record<string, unknown>): NodeOutputHandle[] {
  const def = NODE_REGISTRY[type];
  if (!def) return [];
  if (def.getDynamicOutputs) return def.getDynamicOutputs(config ?? {});
  return def.outputs;
}

export function getRequiredOutputs(type: NodeType, config?: Record<string, unknown>): string[] {
  return resolveOutputs(type, config).filter((o) => o.required).map((o) => o.handle);
}

export function getOutputHandleLabel(type: NodeType, handle: string, config?: Record<string, unknown>): string {
  return resolveOutputs(type, config).find((o) => o.handle === handle)?.label ?? handle;
}

export function isAllowedInFlowType(type: NodeType, flowType: string | undefined): boolean {
  const def = NODE_REGISTRY[type];
  if (!def?.restrictedToFlowType) return true;
  if (!flowType) return false;
  return def.restrictedToFlowType.includes(flowType as FlowTypeKey);
}

export function getOutputHandleColor(handle: string): string {
  // Cores convencionais para os handles especiais
  if (handle === "dadosConfirmados" || handle === "autorizado") return "#34d399";
  if (handle === "dadosNaoConfirmados" || handle === "naoAutorizado") return "#f87171";
  if (handle === "semResposta") return "#94a3b8";
  if (handle === "fallback") return "#94a3b8";
  // Intents do catálogo COLETAR_INTENCAO ganham cores próprias
  if (handle === "visita") return "#60a5fa";
  if (handle === "ifood") return "#fb923c";
  if (handle === "encomenda") return "#fbbf24";
  if (handle === "prestador") return "#c084fc";
  if (handle === "morador") return "#34d399";
  if (handle === "condominio") return "#a78bfa";
  return "#5b6af8";
}
