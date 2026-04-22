"use client";
import { useState } from "react";
import { useUnits, useCreateUnit, useDeleteUnit } from "@/hooks/use-units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Condominium } from "@/types/condominium";

export function UnitsTab({ condominiumId, condominium }: { condominiumId: string; condominium: Condominium }) {
  const { data: units, isLoading } = useUnits(condominiumId);
  const createUnit = useCreateUnit(condominiumId);
  const deleteUnit = useDeleteUnit(condominiumId);
  const [open, setOpen] = useState(false);
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");

  async function handleCreate() {
    try { await createUnit.mutateAsync({ level1_value: l1, level2_value: l2 }); toast.success("Unidade criada"); setOpen(false); setL1(""); setL2(""); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  async function handleDelete(unitId: string) {
    try { await deleteUnit.mutateAsync(unitId); toast.success("Unidade excluida"); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" /> Nova Unidade</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Unidade</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{condominium.level1_label}</Label><Input value={l1} onChange={(e) => setL1(e.target.value)} placeholder={`Ex: A`} /></div>
              <div className="space-y-2"><Label>{condominium.level2_label}</Label><Input value={l2} onChange={(e) => setL2(e.target.value)} placeholder={`Ex: 101`} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!l1 || !l2}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>{condominium.level1_label}</TableHead><TableHead>{condominium.level2_label}</TableHead><TableHead>Status</TableHead><TableHead>Moradores</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
        <TableBody>
          {units?.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.level1_value}</TableCell>
              <TableCell>{u.level2_value}</TableCell>
              <TableCell><Badge variant={u.status === "occupied" ? "default" : "secondary"}>{u.status === "occupied" ? "Ocupada" : "Vaga"}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{u.residents?.length ?? 0}</TableCell>
              <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
            </TableRow>
          ))}
          {!units?.length && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma unidade cadastrada</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
