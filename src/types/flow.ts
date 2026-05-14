export type NodeType =
  | "TIMER"
  | "COMUNICACAO"
  | "COMANDO"
  | "COLETAR_DADOS_MORADOR"
  | "COLETAR_DADOS_VISITA"
  | "CONTATAR"
  | "END"
  | "COLETAR_INTENCAO"
  | "TRANSFERIR_FLUXO";

export interface Flow {
  id: string;
  condominium_id: string;
  name: string;
  type: string;
  active: boolean;
  entry_node_id: string | null;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
  created_at: string;
}

export interface FlowNode {
  id: string;
  flow_id: string;
  condominium_id: string;
  type: NodeType;
  config: Record<string, unknown>;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
  updated_at: string;
}

export interface FlowEdge {
  id: string;
  flow_id: string;
  source_node_id: string;
  source_handle: string;
  target_node_id: string;
  target_handle: string;
  created_at: string;
  updated_at: string;
}

export interface FlowValidationResult {
  valid: boolean;
  errors: Array<{
    code: string;
    message: string;
    nodeId?: string;
    handle?: string;
  }>;
}
