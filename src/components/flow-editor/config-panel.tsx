"use client";
import { useState } from "react";
import { X, Check } from "lucide-react";
import type { NodeType } from "@/types/flow";
import { NODE_REGISTRY } from "@/lib/node-registry";
import { useGates } from "@/hooks/use-gates";
import { useEmployeeRolesForCondominium } from "@/hooks/use-employee-roles";
import { useExtensions } from "@/hooks/use-extensions";
import { useVisitorDataFields } from "@/hooks/use-visitor-data-fields";
import { useUnitIdentificationLevels } from "@/hooks/use-unit-identification-levels";
import { useFlows } from "@/hooks/use-flows";
import { useCondominium } from "@/hooks/use-condominiums";
import { INTENT_CATALOGS, INTENT_CATALOG_KEYS } from "@/lib/intent-catalogs";
import { FLOW_TYPES } from "@/lib/flow-types";

interface ConfigPanelProps {
  condominiumId: string;
  selectedNode: { id: string; type: NodeType; config: Record<string, unknown>; isEntry?: boolean } | null;
  onConfigChange: (config: Record<string, unknown>) => void;
}

export function ConfigPanel({ condominiumId, selectedNode, onConfigChange }: ConfigPanelProps) {
  if (!selectedNode) {
    return (
      <div className="p-6 text-center text-xs text-muted-foreground">
        Clique em um node no canvas para configurar
      </div>
    );
  }

  const def = NODE_REGISTRY[selectedNode.type];
  if (!def) return null;

  return (
    <div className="p-3 space-y-4">
      <div className="rounded-lg border border-border bg-muted/40 p-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-7 rounded flex items-center justify-center text-xs font-bold" style={{ background: def.bg, color: def.color }}>
            {def.label[0]}
          </div>
          <div>
            <div className="text-sm font-semibold">{def.label}</div>
            <div className="text-[10px] text-muted-foreground">{selectedNode.id.startsWith("tmp_") ? "Não salvo" : `ID: ${selectedNode.id}`}</div>
          </div>
        </div>
        <div className="text-[11px] text-muted-foreground">{def.description}</div>
      </div>

      {selectedNode.type === "TIMER" && (
        <TimerForm config={selectedNode.config} onChange={onConfigChange} />
      )}
      {selectedNode.type === "COMUNICACAO" && (
        <ComunicacaoForm config={selectedNode.config} onChange={onConfigChange} />
      )}
      {selectedNode.type === "COMANDO" && (
        <ComandoForm condominiumId={condominiumId} config={selectedNode.config} onChange={onConfigChange} />
      )}
      {(selectedNode.type === "COLETAR_DADOS_MORADOR" || selectedNode.type === "COLETAR_DADOS_VISITA") && (
        <ColetarForm
          condominiumId={condominiumId}
          nodeType={selectedNode.type}
          config={selectedNode.config}
          onChange={onConfigChange}
        />
      )}
      {selectedNode.type === "CONTATAR" && (
        <ContatarForm condominiumId={condominiumId} config={selectedNode.config} onChange={onConfigChange} />
      )}
      {selectedNode.type === "END" && (
        <EndForm condominiumId={condominiumId} config={selectedNode.config} onChange={onConfigChange} />
      )}
      {selectedNode.type === "COLETAR_INTENCAO" && (
        <ColetarIntencaoForm config={selectedNode.config} onChange={onConfigChange} />
      )}
      {selectedNode.type === "TRANSFERIR_FLUXO" && (
        <TransferirFluxoForm condominiumId={condominiumId} config={selectedNode.config} onChange={onConfigChange} />
      )}
    </div>
  );
}

// =====================
// Forms
// =====================

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="text-[10px] text-muted-foreground block mb-1">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

function inputClass() {
  return "w-full bg-background border border-border rounded px-2 py-1.5 text-xs outline-none focus:border-primary transition-colors";
}

function TimerForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const seconds = Number(config.durationSeconds ?? 0);
  return (
    <div className="space-y-3">
      <Field label="Duração" hint="Quantos segundos aguardar antes de continuar">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={3600}
            value={seconds || ""}
            placeholder="Ex: 30"
            className={inputClass()}
            onChange={(e) => onChange({ ...config, durationSeconds: parseInt(e.target.value) || 0 })}
          />
          <span className="text-xs text-muted-foreground shrink-0">seg</span>
        </div>
      </Field>
    </div>
  );
}

function ComunicacaoForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const mode = (config.mode as string) || "tts";
  return (
    <div className="space-y-3">
      <Field label="Modo">
        <select
          className={inputClass()}
          value={mode}
          onChange={(e) => onChange({ ...config, mode: e.target.value })}
        >
          <option value="tts">TTS direto (texto fixo)</option>
          <option value="llm">Prompt para LLM (resposta dinâmica)</option>
        </select>
      </Field>
      <Field label={mode === "llm" ? "Prompt para a LLM" : "Texto a falar"} hint={mode === "llm" ? "A LLM vai gerar a fala baseada nesse prompt" : "Texto exato que será sintetizado"}>
        <textarea
          rows={4}
          className={`${inputClass()} resize-y min-h-[72px]`}
          placeholder={mode === "llm" ? "Ex: Cumprimente o visitante e pergunte como pode ajudar..." : "Ex: Aguarde, estamos verificando..."}
          value={(config.text as string) || ""}
          onChange={(e) => onChange({ ...config, text: e.target.value })}
        />
      </Field>
    </div>
  );
}

function ComandoForm({ condominiumId, config, onChange }: { condominiumId: string; config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const command = (config.command as string) || "open_gate";
  const { data: gates, isLoading } = useGates(condominiumId);
  return (
    <div className="space-y-3">
      <Field label="Comando">
        <select className={inputClass()} value={command} onChange={(e) => onChange({ ...config, command: e.target.value })}>
          <option value="open_gate">Abrir portão</option>
        </select>
      </Field>
      {command === "open_gate" && (
        <Field label="Portão" hint={!gates?.length && !isLoading ? "Cadastre portões em Configurações" : undefined}>
          <select
            className={inputClass()}
            value={(config.gateId as string) || ""}
            onChange={(e) => onChange({ ...config, gateId: e.target.value || null })}
          >
            <option value="">Selecione…</option>
            {gates?.map((g) => (
              <option key={g.id} value={g.id}>{g.label} ({g.slug})</option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}

interface ColetarItem {
  key: string;
  label: string;
  description: string | null;
}

// Campos sempre disponíveis em COLETAR_DADOS_VISITA
const VISITA_ALLOWED_KEYS = ["nome", "cpf", "rg"];
// Campo sempre disponível em COLETAR_DADOS_MORADOR (junto com level1/level2 do condomínio)
const MORADOR_BASE_KEYS = ["nome"];

function ColetarForm({
  condominiumId,
  nodeType,
  config,
  onChange,
}: {
  condominiumId: string;
  nodeType: "COLETAR_DADOS_MORADOR" | "COLETAR_DADOS_VISITA";
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  const { data: visitorFields } = useVisitorDataFields();
  const { data: unitLevels } = useUnitIdentificationLevels();
  const { data: condominium } = useCondominium(condominiumId);
  const selected = (config.requestedFields as string[]) || [];
  const [showPicker, setShowPicker] = useState(false);

  // Lista plana de campos disponíveis no picker, filtrada por contexto
  const items: ColetarItem[] = (() => {
    if (nodeType === "COLETAR_DADOS_VISITA") {
      return (visitorFields ?? [])
        .filter((f) => VISITA_ALLOWED_KEYS.includes(f.key))
        .map((f) => ({ key: f.key, label: f.label, description: f.description }));
    }
    // COLETAR_DADOS_MORADOR: level1/level2 do condomínio + nome
    const result: ColetarItem[] = [];
    if (condominium?.level1_label) {
      const match = (unitLevels ?? []).find(
        (l) => l.label.toLowerCase() === condominium.level1_label.toLowerCase()
      );
      if (match) result.push({ key: match.key, label: match.label, description: match.description });
    }
    if (condominium?.level2_label) {
      const match = (unitLevels ?? []).find(
        (l) => l.label.toLowerCase() === condominium.level2_label.toLowerCase()
      );
      if (match) result.push({ key: match.key, label: match.label, description: match.description });
    }
    for (const key of MORADOR_BASE_KEYS) {
      const f = (visitorFields ?? []).find((vf) => vf.key === key);
      if (f) result.push({ key: f.key, label: f.label, description: f.description });
    }
    return result;
  })();

  function toggle(key: string) {
    const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
    onChange({ ...config, requestedFields: next });
  }

  return (
    <div className="space-y-3">
      <Field label="Campos a coletar" hint={selected.length === 0 ? "Selecione ao menos um campo" : undefined}>
        <div className="space-y-2">
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((key) => {
                const f = items.find((it) => it.key === key);
                return (
                  <span key={key} className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-2 py-0.5">
                    {f?.label ?? key}
                    <button onClick={() => toggle(key)} className="hover:text-blue-300">
                      <X className="size-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className="text-[11px] text-primary hover:underline"
          >
            {showPicker ? "− Ocultar" : "+ Adicionar campos"}
          </button>
          {showPicker && (
            <div className="border border-border rounded p-2 max-h-56 overflow-y-auto space-y-1">
              {items.length === 0 ? (
                <p className="text-[10px] text-muted-foreground text-center py-2">
                  Nenhum campo disponível. Confira a nomenclatura do condomínio em Configurações.
                </p>
              ) : (
                items.map((it) => {
                  const isSelected = selected.includes(it.key);
                  return (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => toggle(it.key)}
                      className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center gap-2 transition-colors ${isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
                    >
                      <div className={`size-3.5 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-border"}`}>
                        {isSelected && <Check className="size-3 text-white" />}
                      </div>
                      <span>{it.label}</span>
                      {it.description && <span className="text-muted-foreground text-[10px]">— {it.description}</span>}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </Field>
      <Field label="Pergunta ao visitante" hint="Texto que será falado/usado como prompt da LLM">
        <textarea
          rows={3}
          className={`${inputClass()} resize-y min-h-[60px]`}
          placeholder="Ex: Por favor, informe seu nome completo e CPF…"
          value={(config.promptText as string) || ""}
          onChange={(e) => onChange({ ...config, promptText: e.target.value })}
        />
      </Field>
    </div>
  );
}

function ColetarIntencaoForm({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const catalogKey = (config.catalogKey as string) || "o_que_deseja";
  const catalog = INTENT_CATALOGS[catalogKey as keyof typeof INTENT_CATALOGS];
  return (
    <div className="space-y-3">
      <Field label="Catálogo de intenções" hint="As saídas do node são geradas a partir do catálogo escolhido + uma saída 'fallback'">
        <select
          className={inputClass()}
          value={catalogKey}
          onChange={(e) => onChange({ ...config, catalogKey: e.target.value })}
        >
          {INTENT_CATALOG_KEYS.map((k) => (
            <option key={k} value={k}>{INTENT_CATALOGS[k].label}</option>
          ))}
        </select>
      </Field>
      {catalog && (
        <div className="rounded border border-border bg-muted/30 p-2 text-[10px] space-y-1">
          <div className="text-muted-foreground uppercase tracking-wider">Saídas geradas</div>
          {catalog.intents.map((i) => (
            <div key={i.key} className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary/60" />
              <span className="text-foreground">{i.label}</span>
              <span className="text-muted-foreground ml-auto">{i.key}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-slate-400" />
            <span className="text-foreground">Não identificado</span>
            <span className="text-muted-foreground ml-auto">fallback</span>
          </div>
        </div>
      )}
      <Field label="Prompt para a LLM" hint="Texto que orienta a classificação. Pode incluir contexto do condomínio.">
        <textarea
          rows={4}
          className={`${inputClass()} resize-y min-h-[72px]`}
          placeholder="Ex: Identifique a partir da fala do visitante o tipo de atendimento entre as opções disponíveis…"
          value={(config.promptText as string) || ""}
          onChange={(e) => onChange({ ...config, promptText: e.target.value })}
        />
      </Field>
    </div>
  );
}

function TransferirFluxoForm({ condominiumId, config, onChange }: { condominiumId: string; config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const { data: flows } = useFlows(condominiumId);
  const nonRootFlows = (flows ?? []).filter((f) => f.type !== "ROOT");
  return (
    <div className="space-y-3">
      <Field label="Fluxo destino" hint={!nonRootFlows.length ? "Nenhum fluxo específico cadastrado. Crie pelo menos um na lista de fluxos." : "A chamada continua nesse fluxo, do nó de entrada"}>
        <select
          className={inputClass()}
          value={(config.targetFlowId as string) || ""}
          onChange={(e) => onChange({ ...config, targetFlowId: e.target.value || null })}
        >
          <option value="">Selecione…</option>
          {nonRootFlows.map((f) => (
            <option key={f.id} value={f.id}>
              {FLOW_TYPES[f.type as keyof typeof FLOW_TYPES]?.label ?? f.name}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function EndForm({ condominiumId, config, onChange }: { condominiumId: string; config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const behavior = (config.behavior as string) || "hangup";
  const { data: extensions } = useExtensions(condominiumId);
  return (
    <div className="space-y-3">
      <Field label="Ao chegar nesse node" hint={
        behavior === "hangup" ? "Envia comando de hangup pra ElevenLabs e finaliza a chamada" :
        behavior === "transfer" ? "Transfere a ligação pro ramal escolhido (ou fallback do condomínio)" :
        "Apenas para a execução. A ligação fica aberta — útil pra testes"
      }>
        <select
          className={inputClass()}
          value={behavior}
          onChange={(e) => onChange({ ...config, behavior: e.target.value })}
        >
          <option value="hangup">Desligar a ligação</option>
          <option value="transfer">Transferir para ramal</option>
          <option value="silent">Encerrar execução (não desliga)</option>
        </select>
      </Field>
      {behavior === "transfer" && (
        <Field label="Ramal de destino" hint={!extensions?.length ? "Sem ramal: cai no fallback do condomínio" : "Vazio = usa o fallback do condomínio"}>
          <select
            className={inputClass()}
            value={(config.extensionId as string) || ""}
            onChange={(e) => onChange({ ...config, extensionId: e.target.value || null })}
          >
            <option value="">Fallback do condomínio</option>
            {extensions?.map((ext) => (
              <option key={ext.id} value={ext.id}>{ext.name} ({ext.number})</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Mensagem antes de encerrar (opcional)" hint="Texto falado pelo TTS antes do hangup/transfer">
        <textarea
          rows={3}
          className={`${inputClass()} resize-y min-h-[60px]`}
          placeholder="Ex: Obrigado, até logo!"
          value={(config.message as string) || ""}
          onChange={(e) => onChange({ ...config, message: e.target.value })}
        />
      </Field>
    </div>
  );
}

function ContatarForm({ condominiumId, config, onChange }: { condominiumId: string; config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const target = (config.target as string) || "morador";
  const { data: roles } = useEmployeeRolesForCondominium(condominiumId);
  return (
    <div className="space-y-3">
      <Field label="Quem contatar">
        <select className={inputClass()} value={target} onChange={(e) => onChange({ ...config, target: e.target.value })}>
          <option value="morador">Morador (identificado na coleta de dados)</option>
          <option value="funcionario">Funcionário do condomínio</option>
        </select>
      </Field>
      {target === "funcionario" && (
        <Field label="Cargo" hint={!roles?.length ? "Cadastre funcionários no condomínio" : undefined}>
          <select
            className={inputClass()}
            value={(config.employeeRoleKey as string) || ""}
            onChange={(e) => onChange({ ...config, employeeRoleKey: e.target.value || null })}
          >
            <option value="">Selecione…</option>
            {roles?.map((r) => (
              <option key={r.id} value={r.key}>{r.label}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Canal">
        <select
          className={inputClass()}
          value={(config.channel as string) || "interfone"}
          onChange={(e) => onChange({ ...config, channel: e.target.value })}
        >
          <option value="interfone">Interfone</option>
          <option value="telefone">Telefone</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </Field>
      <Field label="Timeout (segundos)" hint="Quanto tempo aguardar resposta antes de cair em 'sem resposta'">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={5}
            max={120}
            placeholder="30"
            className={inputClass()}
            value={(config.timeoutSeconds as number) || ""}
            onChange={(e) => onChange({ ...config, timeoutSeconds: parseInt(e.target.value) || null })}
          />
          <span className="text-xs text-muted-foreground shrink-0">seg</span>
        </div>
      </Field>
    </div>
  );
}
