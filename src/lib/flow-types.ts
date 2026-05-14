// Espelha src/constants/flowTypes.js do backend portaria.
// Mudança aqui exige mudança correspondente lá (e migration do banco se aplicável).

export type FlowTypeKey =
  | "ROOT"
  | "VISITA_MORADOR"
  | "IFOOD_MORADOR"
  | "ENCOMENDA_MORADOR"
  | "ENCOMENDA_CONDOMINIO"
  | "PRESTADOR_MORADOR"
  | "PRESTADOR_CONDOMINIO";

export interface FlowTypeDefinition {
  label: string;
  description: string;
  isRoot?: boolean;
}

export const FLOW_TYPES: Record<FlowTypeKey, FlowTypeDefinition> = {
  ROOT: {
    label: "Identificação de intenção",
    description: "Fluxo raiz que classifica o atendimento e redireciona para o fluxo correto",
    isRoot: true,
  },
  VISITA_MORADOR: {
    label: "Visita ao morador",
    description: "Visitante chegou para visitar um morador",
  },
  IFOOD_MORADOR: {
    label: "Entrega de iFood",
    description: "Entregador de iFood/comida para morador",
  },
  ENCOMENDA_MORADOR: {
    label: "Encomenda para morador",
    description: "Entrega de pacote/encomenda para morador",
  },
  ENCOMENDA_CONDOMINIO: {
    label: "Encomenda para condomínio",
    description: "Entrega de pacote/encomenda para o condomínio (administração)",
  },
  PRESTADOR_MORADOR: {
    label: "Prestador para morador",
    description: "Prestador de serviço contratado por um morador",
  },
  PRESTADOR_CONDOMINIO: {
    label: "Prestador para condomínio",
    description: "Prestador de serviço contratado pelo condomínio",
  },
};

export const FLOW_TYPE_KEYS = Object.keys(FLOW_TYPES) as FlowTypeKey[];
export const NON_ROOT_TYPE_KEYS = FLOW_TYPE_KEYS.filter((k) => !FLOW_TYPES[k].isRoot);
