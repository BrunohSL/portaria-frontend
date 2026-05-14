"use client";
import type { ReactElement } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Trash2, Play } from "lucide-react";
import { NODE_REGISTRY, getOutputHandleColor, resolveOutputs } from "@/lib/node-registry";
import type { NodeType } from "@/types/flow";

export interface FlowNodeData extends Record<string, unknown> {
  type: NodeType;
  config: Record<string, unknown>;
  isEntry?: boolean;
  branchLabel?: string;
  onDelete?: (id: string) => void;
  onSetEntry?: (id: string) => void;
}

const ICONS: Record<NodeType, ReactElement> = {
  TIMER: <ClockIcon />,
  COMUNICACAO: <BubbleIcon />,
  COMANDO: <BoltIcon />,
  COLETAR_DADOS_MORADOR: <UserCheckIcon />,
  COLETAR_DADOS_VISITA: <UserPlusIcon />,
  CONTATAR: <PhoneIcon />,
  END: <StopIcon />,
  COLETAR_INTENCAO: <RouterIcon />,
  TRANSFERIR_FLUXO: <ArrowRightIcon />,
};

// Tamanhos do handle. O dot visível é 14px; no hover cresce pra 21px (scale 1.5).
// Combina com `connectionRadius` no canvas pra snap acontecer mesmo longe da bolinha.
const HANDLE_BASE_STYLE: React.CSSProperties = {
  width: 14,
  height: 14,
  border: "2px solid #080a0f",
  cursor: "crosshair",
  transition: "transform 120ms ease, box-shadow 120ms ease",
};

export function FlowNode({ id, data, selected }: NodeProps) {
  const nd = data as FlowNodeData;
  const def = NODE_REGISTRY[nd.type];
  if (!def) return null;

  const summary = buildSummary(nd.type, nd.config);
  const outs = resolveOutputs(nd.type, nd.config);
  const isMultiOutput = outs.length > 1;

  return (
    <div
      className="rounded-lg border bg-[#0f1420] w-[260px] transition-shadow relative"
      style={{
        borderColor: nd.isEntry ? "#34d399" : selected ? def.color : "#1e2a3a",
        boxShadow: nd.isEntry
          ? `0 0 0 2px rgba(52, 211, 153, 0.35), 0 4px 18px rgba(52, 211, 153, 0.2)`
          : selected
            ? `0 0 0 2px ${def.color}40, 0 4px 18px ${def.color}25`
            : undefined,
      }}
    >
      {/* Badge "ENTRADA" sempre visível pra ficar óbvio qual é o ponto de partida */}
      {nd.isEntry && (
        <div className="absolute -top-2.5 left-3 z-10 text-[9px] px-2 py-0.5 rounded-full bg-[#34d399] text-black font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
          <Play className="size-2.5" fill="currentColor" />
          Entrada
        </div>
      )}

      <div className="h-[3px] rounded-t-lg" style={{ background: nd.isEntry ? "#34d399" : def.color, opacity: 0.8 }} />

      {/* Header */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center shrink-0"
            style={{ background: def.bg, color: def.color }}
          >
            {ICONS[nd.type]}
          </div>
          <div className="text-[12px] font-semibold text-[#e8ecf4] flex-1 truncate min-w-0">{def.label}</div>
          {nd.onSetEntry && (
            <button
              className="size-5 rounded flex items-center justify-center text-[#7a8499] hover:text-[#34d399] hover:bg-[#34d399]/10 transition-colors shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                nd.onSetEntry?.(id);
              }}
              title={nd.isEntry ? "Este é o node de entrada do fluxo" : "Definir como ponto de entrada do fluxo"}
            >
              <Play
                className="size-3.5"
                fill={nd.isEntry ? "#34d399" : "none"}
                stroke={nd.isEntry ? "#34d399" : "currentColor"}
              />
            </button>
          )}
          {nd.onDelete && (
            <button
              className="size-5 rounded flex items-center justify-center text-[#7a8499] hover:text-[#f87171] hover:bg-[#f87171]/10 transition-colors shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                nd.onDelete?.(id);
              }}
              title="Excluir"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>

        {nd.branchLabel && (
          <div className="text-[10px] mt-1.5 inline-block px-1.5 py-0.5 rounded font-medium" style={{
            background: `${getOutputHandleColor(nd.branchLabel)}20`,
            color: getOutputHandleColor(nd.branchLabel),
          }}>
            ← {humanizeHandle(nd.branchLabel)}
          </div>
        )}

        <div className="text-[10px] text-[#7a8499] leading-snug mt-1">{summary || def.description}</div>
      </div>

      {/* Multi-output rows: cada saída vira uma linha com label + handle dot na borda direita */}
      {isMultiOutput && (
        <div className="border-t border-[#1e2a3a]/60">
          {outs.map((out) => {
            const color = getOutputHandleColor(out.handle);
            return (
              <div key={out.handle} className="relative px-3 py-1.5 flex items-center justify-end">
                <span className="text-[10px] font-medium" style={{ color }}>
                  {out.label.toLowerCase()}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={out.handle}
                  className="hover:!scale-150 hover:!shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                  style={{
                    ...HANDLE_BASE_STYLE,
                    background: color,
                    right: -7,
                    top: "50%",
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Input handle — sempre na esquerda, centro vertical do card */}
      <Handle
        type="target"
        position={Position.Left}
        id="default"
        style={{
          ...HANDLE_BASE_STYLE,
          background: def.color,
          left: -7,
          cursor: "default",
        }}
      />

      {/* Output handle único — fica no centro direito (não usa o layout de linhas) */}
      {!isMultiOutput && outs.length === 1 && (
        <Handle
          type="source"
          position={Position.Right}
          id={outs[0].handle}
          className="hover:!scale-150 hover:!shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
          style={{
            ...HANDLE_BASE_STYLE,
            background: getOutputHandleColor(outs[0].handle),
            right: -7,
          }}
        />
      )}
    </div>
  );
}

function buildSummary(type: NodeType, config: Record<string, unknown>): string {
  if (type === "TIMER") {
    const s = Number(config.durationSeconds ?? 0);
    return s > 0 ? `Aguardar ${s} seg` : "Configure a duração";
  }
  if (type === "COMUNICACAO") {
    const text = (config.text as string) || "";
    return text ? `"${text.slice(0, 40)}${text.length > 40 ? "…" : ""}"` : "Configure o texto";
  }
  if (type === "COMANDO") {
    if (config.command === "open_gate") {
      return config.gateId ? `Abrir portão #${config.gateId}` : "Selecione um portão";
    }
    return "Selecione um comando";
  }
  if (type === "COLETAR_DADOS_MORADOR" || type === "COLETAR_DADOS_VISITA") {
    const fields = (config.requestedFields as string[]) || [];
    return fields.length ? `${fields.length} campo(s): ${fields.join(", ")}` : "Selecione os campos";
  }
  if (type === "CONTATAR") {
    const target = config.target as string;
    const channel = config.channel as string;
    if (!target) return "Configure alvo e canal";
    return `${target}${channel ? ` via ${channel}` : ""}`;
  }
  if (type === "END") {
    const behavior = (config.behavior as string) || "hangup";
    if (behavior === "hangup") return "Desliga a ligação";
    if (behavior === "transfer") return "Transfere para ramal";
    return "Encerra a execução";
  }
  if (type === "COLETAR_INTENCAO") {
    const catalogKey = config.catalogKey as string;
    if (!catalogKey) return "Selecione o catálogo de intenções";
    return catalogKey === "o_que_deseja" ? "Classifica: visita / iFood / encomenda / prestador" : "Refina: morador / condomínio";
  }
  if (type === "TRANSFERIR_FLUXO") {
    return config.targetFlowId ? `→ fluxo #${config.targetFlowId}` : "Selecione o fluxo destino";
  }
  return "";
}

function humanizeHandle(handle: string): string {
  const map: Record<string, string> = {
    dadosConfirmados: "dados confirmados",
    dadosNaoConfirmados: "dados não confirmados",
    autorizado: "autorizado",
    naoAutorizado: "não autorizado",
    semResposta: "sem resposta",
    default: "próximo",
  };
  return map[handle] ?? handle;
}

function ClockIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" /><path d="M6.5 4v3l2 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>;
}
function BubbleIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3a1 1 0 011-1h7a1 1 0 011 1v5a1 1 0 01-1 1H6l-3 2.5V9H3a1 1 0 01-1-1V3z" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
function BoltIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M7 2L3 7h3l-1 4 4-5H6l1-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>;
}
function UserCheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 11c0-2.2 1.6-4 3.5-4s3.5 1.8 3.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M9 7l1.3 1.3L12 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
function UserPlusIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2" /><path d="M1.5 11c0-2.2 1.6-4 3.5-4s3.5 1.8 3.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /><path d="M10.5 5v3M9 6.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}
function PhoneIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 2.5c0-.3.2-.5.5-.5h2l1 2.5-.8.7c.5 1.1 1.4 2 2.5 2.5l.7-.8 2.5 1V10c0 .3-.2.5-.5.5C5 10.5 2 7.5 2 2.5z" stroke="currentColor" strokeWidth="1.3" /></svg>;
}
function StopIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.25" /></svg>;
}
function RouterIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="2.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="10.5" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="10.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 6l5-2.5M4 7l5 2.5" stroke="currentColor" strokeWidth="1.2"/></svg>;
}
function ArrowRightIcon() {
  return <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
