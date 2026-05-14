"use client";
import { use, useEffect, useState } from "react";
import { useCondominium, useUpdateCondominium } from "@/hooks/use-condominiums";
import { useGates, useCreateGate, useUpdateGate, useDeleteGate } from "@/hooks/use-gates";
import { useExtensions, useCreateExtension, useUpdateExtension, useDeleteExtension } from "@/hooks/use-extensions";
import { useUnitIdentificationLevels } from "@/hooks/use-unit-identification-levels";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface DraftGate {
  id?: string;
  slug: string;
  label: string;
  dns: string;
  extension: string;
  brand: string;
  position: number;
}

interface DraftExtension {
  id?: string;
  name: string;
  number: string;
}

function gateChanged(draft: DraftGate, original: DraftGate) {
  return (
    draft.slug !== original.slug ||
    draft.label !== original.label ||
    draft.dns !== original.dns ||
    draft.extension !== original.extension ||
    draft.brand !== original.brand ||
    draft.position !== original.position
  );
}

function extensionChanged(draft: DraftExtension, original: DraftExtension) {
  return draft.name !== original.name || draft.number !== original.number;
}

export default function ConfiguracoesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: condo, isLoading } = useCondominium(id);
  const { data: serverGates } = useGates(id);
  const { data: serverExtensions } = useExtensions(id);
  const { data: levelOptions } = useUnitIdentificationLevels();

  const updateCondo = useUpdateCondominium(id);
  const createGate = useCreateGate(id);
  const updateGate = useUpdateGate(id);
  const deleteGate = useDeleteGate(id);
  const createExt = useCreateExtension(id);
  const updateExt = useUpdateExtension(id);
  const deleteExt = useDeleteExtension(id);

  const [gates, setGates] = useState<DraftGate[]>([]);
  const [extensions, setExtensions] = useState<DraftExtension[]>([]);
  const [originalGates, setOriginalGates] = useState<DraftGate[]>([]);
  const [originalExtensions, setOriginalExtensions] = useState<DraftExtension[]>([]);
  const [fallback, setFallback] = useState("");
  const [level1Label, setLevel1Label] = useState("");
  const [level2Label, setLevel2Label] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    if (!condo || !serverGates || !serverExtensions) return;
    const gatesDraft: DraftGate[] = serverGates.map((g) => ({
      id: g.id,
      slug: g.slug,
      label: g.label ?? "",
      dns: g.dns ?? "",
      extension: g.extension ?? "",
      brand: g.brand ?? "",
      position: g.position ?? 0,
    }));
    const extDraft: DraftExtension[] = serverExtensions.map((e) => ({
      id: e.id,
      name: e.name,
      number: e.number,
    }));
    setGates(gatesDraft);
    setExtensions(extDraft);
    setOriginalGates(gatesDraft.map((g) => ({ ...g })));
    setOriginalExtensions(extDraft.map((e) => ({ ...e })));
    setFallback(condo.fallback_extension ?? "");
    setLevel1Label(condo.level1_label ?? "Bloco");
    setLevel2Label(condo.level2_label ?? "Apto");
    setLoaded(true);
  }, [condo, serverGates, serverExtensions, loaded]);

  function addGate() {
    const num = gates.length + 1;
    setGates([...gates, { slug: `gate${num}`, label: "", dns: "", extension: "", brand: "", position: num }]);
  }

  function removeGate(index: number) {
    setGates(gates.filter((_, i) => i !== index));
  }

  function patchGate(index: number, field: keyof DraftGate, value: string | number) {
    const updated = [...gates];
    updated[index] = { ...updated[index], [field]: value };
    setGates(updated);
  }

  function addExtension() {
    setExtensions([...extensions, { name: "", number: "" }]);
  }

  function removeExtension(index: number) {
    setExtensions(extensions.filter((_, i) => i !== index));
  }

  function patchExtension(index: number, field: keyof DraftExtension, value: string) {
    const updated = [...extensions];
    updated[index] = { ...updated[index], [field]: value };
    setExtensions(updated);
  }

  async function handleSave() {
    try {
      const removedGates = originalGates.filter((og) => og.id && !gates.find((g) => g.id === og.id));
      await Promise.all(removedGates.map((g) => deleteGate.mutateAsync(g.id!)));

      for (const g of gates) {
        if (!g.id) {
          await createGate.mutateAsync({
            slug: g.slug,
            label: g.label,
            dns: g.dns || null,
            brand: g.brand || null,
            extension: g.extension || null,
            position: g.position || null,
          });
        } else {
          const original = originalGates.find((og) => og.id === g.id);
          if (original && gateChanged(g, original)) {
            await updateGate.mutateAsync({
              gateId: g.id,
              data: {
                slug: g.slug,
                label: g.label,
                dns: g.dns || null,
                brand: g.brand || null,
                extension: g.extension || null,
                position: g.position || null,
              },
            });
          }
        }
      }

      const removedExt = originalExtensions.filter((oe) => oe.id && !extensions.find((e) => e.id === oe.id));
      await Promise.all(removedExt.map((e) => deleteExt.mutateAsync(e.id!)));

      for (const e of extensions) {
        if (!e.id) {
          if (e.name && e.number) {
            await createExt.mutateAsync({ name: e.name, number: e.number });
          }
        } else {
          const original = originalExtensions.find((oe) => oe.id === e.id);
          if (original && extensionChanged(e, original)) {
            await updateExt.mutateAsync({
              extensionId: e.id,
              data: { name: e.name, number: e.number },
            });
          }
        }
      }

      const condoChanges: Record<string, unknown> = {};
      if (fallback !== (condo?.fallback_extension ?? "")) condoChanges.fallback_extension = fallback;
      if (level1Label !== (condo?.level1_label ?? "")) condoChanges.level1_label = level1Label;
      if (level2Label !== (condo?.level2_label ?? "")) condoChanges.level2_label = level2Label;
      if (Object.keys(condoChanges).length > 0) {
        await updateCondo.mutateAsync(condoChanges);
      }

      toast.success("Configurações salvas");
      setLoaded(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!condo) return <p className="text-muted-foreground">Condomínio não encontrado</p>;

  const saving = updateCondo.isPending || createGate.isPending || updateGate.isPending || deleteGate.isPending ||
    createExt.isPending || updateExt.isPending || deleteExt.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/condominios/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
          <h1 className="text-2xl font-bold">Configurações — {condo.name}</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4 mr-2" />{saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Portões / Equipamentos</CardTitle>
              <CardDescription>Configure os portões de acesso do condomínio</CardDescription>
            </div>
            <Button size="sm" onClick={addGate}><Plus className="size-4 mr-1" /> Adicionar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {gates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum portão configurado</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Posição</TableHead><TableHead>Slug</TableHead><TableHead>Nome</TableHead><TableHead>DNS</TableHead><TableHead>Ramal</TableHead><TableHead>Marca</TableHead><TableHead className="w-12"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {gates.map((g, i) => (
                  <TableRow key={g.id ?? `new-${i}`}>
                    <TableCell><Input type="number" value={g.position} onChange={(e) => patchGate(i, "position", parseInt(e.target.value) || 0)} className="w-16" /></TableCell>
                    <TableCell><Input value={g.slug} onChange={(e) => patchGate(i, "slug", e.target.value)} placeholder="gate1" className="w-24" /></TableCell>
                    <TableCell><Input value={g.label} onChange={(e) => patchGate(i, "label", e.target.value)} placeholder="Portão Principal" /></TableCell>
                    <TableCell><Input value={g.dns} onChange={(e) => patchGate(i, "dns", e.target.value)} placeholder="192.168.1.10" /></TableCell>
                    <TableCell><Input value={g.extension} onChange={(e) => patchGate(i, "extension", e.target.value)} placeholder="100" /></TableCell>
                    <TableCell><Input value={g.brand} onChange={(e) => patchGate(i, "brand", e.target.value)} placeholder="Intelbras" /></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => removeGate(i)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ramais Internos</CardTitle>
              <CardDescription>Ramais do condomínio (portaria, síndico, etc.)</CardDescription>
            </div>
            <Button size="sm" onClick={addExtension}><Plus className="size-4 mr-1" /> Adicionar</Button>
          </div>
        </CardHeader>
        <CardContent>
          {extensions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum ramal configurado</p>
          ) : (
            <div className="space-y-3">
              {extensions.map((ext, i) => (
                <div key={ext.id ?? `new-${i}`} className="flex items-center gap-3">
                  <Input value={ext.name} onChange={(e) => patchExtension(i, "name", e.target.value)} placeholder="Nome (ex: Portaria)" className="flex-1" />
                  <Input value={ext.number} onChange={(e) => patchExtension(i, "number", e.target.value)} placeholder="Ramal (ex: 100)" className="w-32" />
                  <Button variant="ghost" size="icon" onClick={() => removeExtension(i)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ramal de Fallback</CardTitle>
          <CardDescription>Ramal para transferir a chamada em caso de falha no atendimento automatizado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Input value={fallback} onChange={(e) => setFallback(e.target.value)} placeholder="Ex: 200" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nomenclatura das unidades</CardTitle>
          <CardDescription>
            Como o condomínio rotula os níveis das unidades. Ex: Bloco/Apto, Quadra/Lote, Rua/Número.
            Esses rótulos aparecem nos cadastros de unidades, contatos e na fala da IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Nível 1</label>
              <select
                className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-primary transition-colors"
                value={level1Label}
                onChange={(e) => setLevel1Label(e.target.value)}
              >
                <option value="">Selecione…</option>
                {levelOptions?.map((opt) => (
                  <option key={opt.key} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Nível 2</label>
              <select
                className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-primary transition-colors"
                value={level2Label}
                onChange={(e) => setLevel2Label(e.target.value)}
              >
                <option value="">Selecione…</option>
                {levelOptions?.map((opt) => (
                  <option key={opt.key} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Para adicionar novas opções, contate o time de produto. Os mesmos níveis ficam disponíveis no node <span className="font-medium">Coletar dados do morador</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
