"use client";
import { useState } from "react";
import { useFlows, useCreateFlow, useDeleteFlow } from "@/hooks/use-flows";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const flowTypes = ["VISITA", "IFOOD", "PRESTADOR", "ENTREGA", "EMERGENCIA"];

export function FlowsTab({ condominiumId }: { condominiumId: string }) {
  const { data: flows } = useFlows(condominiumId);
  const createFlow = useCreateFlow(condominiumId);
  const deleteFlow = useDeleteFlow(condominiumId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("VISITA");

  async function handleCreate() {
    try { await createFlow.mutateAsync({ name, type }); toast.success("Fluxo criado"); setOpen(false); setName(""); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  async function handleDelete(flowId: string) {
    try { await deleteFlow.mutateAsync(flowId); toast.success("Fluxo excluido"); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" /> Novo Fluxo</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Fluxo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Fluxo Visita" /></div>
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{flowTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!name}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead><TableHead>Steps</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
        <TableBody>
          {flows?.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-medium">{f.name}</TableCell>
              <TableCell><Badge variant="outline">{f.type}</Badge></TableCell>
              <TableCell><Badge variant={f.active ? "default" : "secondary"}>{f.active ? "Ativo" : "Inativo"}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{f.steps?.length ?? 0}</TableCell>
              <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
            </TableRow>
          ))}
          {!flows?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum fluxo cadastrado</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
