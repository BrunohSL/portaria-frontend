"use client";
import { useMemo, useState } from "react";
import { useFlows, useCreateFlow, useDeleteFlow } from "@/hooks/use-flows";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, GitBranch, Crown } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { FLOW_TYPES, NON_ROOT_TYPE_KEYS, type FlowTypeKey } from "@/lib/flow-types";

export function FlowsCard({ condominiumId }: { condominiumId: string }) {
  const { data: flows } = useFlows(condominiumId);
  const createFlow = useCreateFlow(condominiumId);
  const deleteFlow = useDeleteFlow(condominiumId);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FlowTypeKey | "">("");

  const existingTypes = useMemo(() => new Set((flows ?? []).map((f) => f.type as FlowTypeKey)), [flows]);
  const availableTypes = NON_ROOT_TYPE_KEYS.filter((t) => !existingTypes.has(t));
  const rootFlow = (flows ?? []).find((f) => f.type === "ROOT");
  const otherFlows = (flows ?? []).filter((f) => f.type !== "ROOT");

  async function handleCreate() {
    if (!type) return;
    try {
      const def = FLOW_TYPES[type];
      await createFlow.mutateAsync({ name: def.label, type });
      toast.success("Fluxo criado");
      setOpen(false);
      setType("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleDelete(flowId: string) {
    try {
      await deleteFlow.mutateAsync(flowId);
      toast.success("Fluxo excluído");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  function renderRow(f: NonNullable<typeof flows>[number]) {
    const def = FLOW_TYPES[f.type as FlowTypeKey];
    const isRoot = f.type === "ROOT";
    return (
      <TableRow key={f.id}>
        <TableCell className="font-medium">
          <Link href={`/condominios/${condominiumId}/fluxos/${f.id}`} className="hover:underline flex items-center gap-2">
            {isRoot && <Crown className="size-3.5 text-orange-400" />}
            {def?.label ?? f.name}
          </Link>
        </TableCell>
        <TableCell>
          {isRoot ? (
            <Badge variant="outline" className="border-orange-500/30 text-orange-400">root</Badge>
          ) : (
            <Badge variant="outline">{f.type}</Badge>
          )}
        </TableCell>
        <TableCell><Badge variant={f.active ? "default" : "secondary"}>{f.active ? "Ativo" : "Inativo"}</Badge></TableCell>
        <TableCell className="text-muted-foreground">{f.nodes?.length ?? "—"}</TableCell>
        <TableCell>
          {!isRoot && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="size-4 text-muted-foreground" />
            Fluxos
          </CardTitle>
          <CardDescription>Fluxo raiz de identificação + um fluxo por tipo de atendimento</CardDescription>
        </div>
        <div className="flex items-center justify-end gap-2 flex-wrap">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button size="sm" disabled={!availableTypes.length}>
                <Plus className="size-4 mr-1" /> Novo Fluxo
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Fluxo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Cada condomínio pode ter no máximo 1 fluxo por tipo. O fluxo ROOT é gerenciado pelo sistema.
                  </p>
                  <Select value={type} onValueChange={(v) => setType((v as FlowTypeKey) ?? "")}>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo de fluxo" /></SelectTrigger>
                    <SelectContent>
                      {availableTypes.map((t) => (
                        <SelectItem key={t} value={t}>{FLOW_TYPES[t].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {type && (
                    <p className="text-xs text-muted-foreground">{FLOW_TYPES[type].description}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={!type}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Nodes</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rootFlow && renderRow(rootFlow)}
              {otherFlows.map(renderRow)}
              {!flows?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum fluxo cadastrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {!availableTypes.length && rootFlow && otherFlows.length === NON_ROOT_TYPE_KEYS.length && (
          <p className="text-xs text-muted-foreground mt-3 text-center">Todos os tipos de fluxo já estão cadastrados.</p>
        )}
      </CardContent>
    </Card>
  );
}
