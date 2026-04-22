"use client";
import { useState } from "react";
import { useResidents, useCreateResident, useDeleteResident } from "@/hooks/use-residents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatPhone } from "@/lib/format";

const typeLabels: Record<string, string> = { owner: "Proprietario", tenant: "Inquilino", dependent: "Dependente" };

export function ResidentsTab({ condominiumId }: { condominiumId: string }) {
  const { data: residents, isLoading } = useResidents(condominiumId);
  const createResident = useCreateResident(condominiumId);
  const deleteResident = useDeleteResident(condominiumId);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("owner");

  async function handleCreate() {
    try { await createResident.mutateAsync({ name, phone, type: type as "owner" | "tenant" | "dependent" }); toast.success("Morador criado"); setOpen(false); setName(""); setPhone(""); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  async function handleDelete(id: string) {
    try { await deleteResident.mutateAsync(id); toast.success("Morador excluido"); } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm"><Plus className="size-4 mr-1" /> Novo Morador</Button>} />
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Morador</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner">Proprietario</SelectItem><SelectItem value="tenant">Inquilino</SelectItem><SelectItem value="dependent">Dependente</SelectItem></SelectContent></Select>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!name}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Telefone</TableHead><TableHead>Tipo</TableHead><TableHead>Unidade</TableHead><TableHead>Status</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
        <TableBody>
          {residents?.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className="text-muted-foreground">{formatPhone(r.phone)}</TableCell>
              <TableCell><Badge variant="outline">{typeLabels[r.type] || r.type}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{r.unit ? `${r.unit.level1_value} - ${r.unit.level2_value}` : "-"}</TableCell>
              <TableCell><Badge variant={r.active ? "default" : "secondary"}>{r.active ? "Ativo" : "Inativo"}</Badge></TableCell>
              <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
            </TableRow>
          ))}
          {!residents?.length && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum morador cadastrado</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
