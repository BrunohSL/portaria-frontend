// Espelha src/constants/intentCatalogs.js do backend portaria.
// Catálogos pré-definidos usados pelo node COLETAR_INTENCAO.

export type IntentCatalogKey = "o_que_deseja" | "para_quem";

export interface IntentDefinition {
  key: string;
  label: string;
}

export interface IntentCatalogDefinition {
  label: string;
  description: string;
  intents: IntentDefinition[];
}

export const INTENT_CATALOGS: Record<IntentCatalogKey, IntentCatalogDefinition> = {
  o_que_deseja: {
    label: "O que o visitante deseja?",
    description: "Classificação primária — o que o visitante está fazendo",
    intents: [
      { key: "visita", label: "Visita ao morador" },
      { key: "ifood", label: "Entrega de iFood" },
      { key: "encomenda", label: "Entrega de encomenda" },
      { key: "prestador", label: "Prestador de serviço" },
    ],
  },
  para_quem: {
    label: "Para quem é o serviço?",
    description: "Refinamento — para o morador ou para o condomínio?",
    intents: [
      { key: "morador", label: "Para um morador" },
      { key: "condominio", label: "Para o condomínio" },
    ],
  },
};

export const INTENT_CATALOG_KEYS = Object.keys(INTENT_CATALOGS) as IntentCatalogKey[];

export function getCatalogOutputs(catalogKey: IntentCatalogKey | string | undefined): { handle: string; label: string; required: boolean }[] {
  const catalog = catalogKey ? INTENT_CATALOGS[catalogKey as IntentCatalogKey] : undefined;
  if (!catalog) return [{ handle: "fallback", label: "Não identificado", required: true }];
  return [
    ...catalog.intents.map((i) => ({ handle: i.key, label: i.label, required: true })),
    { handle: "fallback", label: "Não identificado", required: true },
  ];
}
