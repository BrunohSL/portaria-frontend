"use client";
import { useState, useRef } from "react";
import { useContacts, useDeleteContact, useBatchCreateContacts, useBatchUpdateContacts, useImportContacts } from "@/hooks/use-contacts";
import { useUnits } from "@/hooks/use-units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, PencilOff, Save, Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { Condominium } from "@/types/condominium";

type ContactType = "owner" | "resident" | "visitor";
const typeLabels: Record<ContactType, string> = { owner: "Proprietario", resident: "Morador", visitor: "Visitante" };

interface EditableContact {
  id: string;
  name: string;
  unit_id: string;
  type: ContactType;
  phone: string;
}

interface NewContact {
  tempId: string;
  name: string;
  unit_id: string;
  type: ContactType;
  phone: string;
}

export function ContactsTab({ condominiumId, condominium }: { condominiumId: string; condominium: Condominium }) {
  const { data: contacts } = useContacts(condominiumId);
  const { data: units } = useUnits(condominiumId);
  const deleteContact = useDeleteContact(condominiumId);
  const batchCreate = useBatchCreateContacts(condominiumId);
  const batchUpdate = useBatchUpdateContacts(condominiumId);
  const importContacts = useImportContacts(condominiumId);

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<EditableContact[]>([]);
  const [newRows, setNewRows] = useState<NewContact[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<{ line: number; reason: string }[]>([]);
  const [importErrorsOpen, setImportErrorsOpen] = useState(false);

  function downloadTemplate() {
    const header = `${condominium.level1_label},${condominium.level2_label},nome,telefone,tipo`;
    const examples = [
      `A,101,Joao Silva,11987654321,owner`,
      `A,101,Maria Santos,11912345678,resident`,
      `B,202,Pedro Visitante,11999998888,visitor`,
    ].join("\n");
    const csv = `${header}\n${examples}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_contatos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportSubmit() {
    if (!importFile) return;

    const text = await importFile.text();
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    if (lines.length < 2) {
      toast.error("Arquivo vazio ou sem dados");
      return;
    }

    const rows = lines.slice(1).map((line) => {
      const cols = line.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ""));
      return {
        level1_value: cols[0] || "",
        level2_value: cols[1] || "",
        name: cols[2] || "",
        phone: cols[3] || "",
        type: cols[4] || "",
      };
    }).filter((r) => r.level1_value || r.level2_value || r.name);

    if (rows.length === 0) {
      toast.error("Nenhum contato encontrado no arquivo");
      return;
    }

    try {
      const result = await importContacts.mutateAsync(rows);
      if (result.errors.length > 0) {
        setImportErrors(result.errors);
        setImportErrorsOpen(true);
        toast.warning(`${result.created} criado(s), ${result.errors.length} erro(s)`);
      } else {
        toast.success(`${result.created} contato(s) importado(s)`);
      }
      setImportFile(null);
      setImportOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar");
    }
  }

  function unitLabel(unitId?: string) {
    if (!unitId || !units) return "-";
    const u = units.find((unit) => unit.id === unitId);
    if (!u) return "-";
    return `${u.level1_value} - ${u.level2_value}`;
  }

  function enterEditMode() {
    setEditData((contacts || []).map((c) => ({
      id: c.id,
      name: c.name,
      unit_id: c.unit_id || "",
      type: c.type as ContactType,
      phone: c.phone || "",
    })));
    setNewRows([]);
    setHasChanges(false);
    setEditing(true);
  }

  function tryExitEditMode() {
    if (hasChanges) {
      setConfirmCancelOpen(true);
    } else {
      setEditing(false);
    }
  }

  function confirmCancel() {
    setEditing(false);
    setHasChanges(false);
    setNewRows([]);
    setConfirmCancelOpen(false);
  }

  function updateField(id: string, field: keyof EditableContact, value: string) {
    setEditData((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    setHasChanges(true);
  }

  function addNewRow() {
    setNewRows((prev) => [...prev, { tempId: `new-${Date.now()}`, name: "", unit_id: "", type: "resident", phone: "" }]);
    setHasChanges(true);
  }

  function updateNewRow(tempId: string, field: keyof NewContact, value: string) {
    setNewRows((prev) => prev.map((r) => r.tempId === tempId ? { ...r, [field]: value } : r));
    setHasChanges(true);
  }

  function removeNewRow(tempId: string) {
    setNewRows((prev) => prev.filter((r) => r.tempId !== tempId));
  }

  async function handleSave() {
    const changes = editData.filter((edited) => {
      const original = (contacts || []).find((c) => c.id === edited.id);
      if (!original) return false;
      return (
        original.name !== edited.name ||
        (original.unit_id || "") !== edited.unit_id ||
        original.type !== edited.type ||
        (original.phone || "") !== edited.phone
      );
    });

    const validNew = newRows.filter((r) => r.name && r.unit_id && r.type);

    if (changes.length === 0 && validNew.length === 0) {
      toast.info("Nenhuma alteracao detectada");
      setEditing(false);
      return;
    }

    try {
      if (changes.length > 0) {
        await batchUpdate.mutateAsync(changes);
      }
      if (validNew.length > 0) {
        const result = await batchCreate.mutateAsync(validNew.map((r) => ({ name: r.name, unit_id: r.unit_id, type: r.type, phone: r.phone })));
        if (result.errors.length > 0) {
          toast.warning(`${result.created} criado(s), ${result.errors.length} erro(s)`);
        }
      }
      const msgs = [];
      if (changes.length > 0) msgs.push(`${changes.length} atualizado(s)`);
      if (validNew.length > 0) msgs.push(`${validNew.length} criado(s)`);
      toast.success(msgs.join(", "));
      setEditing(false);
      setHasChanges(false);
      setNewRows([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteContact.mutateAsync(id);
      toast.success("Contato excluido");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={editing ? "default" : "outline"}
            onClick={editing ? tryExitEditMode : enterEditMode}
          >
            {editing ? <><PencilOff className="size-4 mr-1" /> Desativar Edicao</> : <><Pencil className="size-4 mr-1" /> Modo Edicao</>}
          </Button>
          {editing && (
            <Badge variant="outline" className="text-xs">
              {hasChanges ? "Alteracoes nao salvas" : "Sem alteracoes"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={importOpen} onOpenChange={(v) => { setImportOpen(v); if (!v) setImportFile(null); }}>
            <DialogTrigger render={<Button size="sm" variant="outline" disabled={editing}><Upload className="size-4 mr-1" /> Importar CSV</Button>} />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Importar Contatos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                  <FileSpreadsheet className="size-8 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Template CSV</p>
                    <p className="text-xs text-muted-foreground">Baixe o modelo, preencha e envie de volta</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={downloadTemplate}>
                    <Download className="size-4 mr-1" /> Baixar
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Enviar arquivo preenchido</p>
                  <div
                    className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    {importFile ? (
                      <>
                        <FileSpreadsheet className="size-8 text-emerald-500" />
                        <p className="text-sm font-medium">{importFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(importFile.size / 1024).toFixed(1)} KB</p>
                      </>
                    ) : (
                      <>
                        <Upload className="size-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Clique para selecionar o arquivo .csv</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
                <Button onClick={handleImportSubmit} disabled={!importFile || importContacts.isPending}>
                  <Upload className="size-4 mr-1" /> {importContacts.isPending ? "Importando..." : "Importar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Telefone</TableHead>
              {!editing && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {editing ? (<>
              {editData.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Input value={c.name} onChange={(e) => updateField(c.id, "name", e.target.value)} className="h-8 text-sm" />
                  </TableCell>
                  <TableCell>
                    <Select value={c.unit_id} onValueChange={(v) => updateField(c.id, "unit_id", v ?? "")}>
                      <SelectTrigger className="h-8 text-sm w-36"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {units?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.level1_value} - {u.level2_value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={c.type} onValueChange={(v) => updateField(c.id, "type", v ?? "")}>
                      <SelectTrigger className="h-8 text-sm w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Proprietario</SelectItem>
                        <SelectItem value="resident">Morador</SelectItem>
                        <SelectItem value="visitor">Visitante</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={c.phone}
                      onChange={(e) => updateField(c.id, "phone", e.target.value)}
                      className="h-8 text-sm w-40"
                      placeholder="+5519987654321"
                      type="tel"
                    />
                  </TableCell>
                </TableRow>
              ))}
              {/* Novas linhas */}
              {newRows.map((row) => (
                <TableRow key={row.tempId} className="bg-emerald-500/5">
                  <TableCell>
                    <Input
                      value={row.name}
                      onChange={(e) => updateNewRow(row.tempId, "name", e.target.value)}
                      className="h-8 text-sm"
                      placeholder="Nome do contato"
                      autoFocus={newRows[newRows.length - 1]?.tempId === row.tempId}
                    />
                  </TableCell>
                  <TableCell>
                    <Select value={row.unit_id} onValueChange={(v) => updateNewRow(row.tempId, "unit_id", v ?? "")}>
                      <SelectTrigger className="h-8 text-sm w-36"><SelectValue placeholder={`${condominium.level1_label} - ${condominium.level2_label}`} /></SelectTrigger>
                      <SelectContent>
                        {units?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.level1_value} - {u.level2_value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={row.type} onValueChange={(v) => updateNewRow(row.tempId, "type", v ?? "")}>
                      <SelectTrigger className="h-8 text-sm w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Proprietario</SelectItem>
                        <SelectItem value="resident">Morador</SelectItem>
                        <SelectItem value="visitor">Visitante</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        value={row.phone}
                        onChange={(e) => updateNewRow(row.tempId, "phone", e.target.value)}
                        className="h-8 text-sm w-40"
                        placeholder="+5519987654321"
                        type="tel"
                      />
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeNewRow(row.tempId)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Botao + */}
              <TableRow>
                <TableCell colSpan={4}>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground" onClick={addNewRow}>
                    <Plus className="size-4 mr-1" /> Adicionar contato
                  </Button>
                </TableCell>
              </TableRow>
            </>) : (
              contacts?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{unitLabel(c.unit_id)}</TableCell>
                  <TableCell><Badge variant="outline">{typeLabels[c.type as ContactType] || c.type}</Badge></TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">{c.phone || "—"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!contacts?.length && !editing && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum contato cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Save bar */}
      {editing && (
        <div className="flex items-center justify-end gap-3 p-3 rounded-lg border bg-muted/50 sticky bottom-0">
          <span className="text-sm text-muted-foreground mr-auto">
            {editData.length} existente(s){newRows.length > 0 && ` + ${newRows.length} novo(s)`} {hasChanges && "— alteracoes pendentes"}
          </span>
          <Button variant="outline" onClick={tryExitEditMode}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!hasChanges || batchUpdate.isPending || batchCreate.isPending}>
            <Save className="size-4 mr-1" /> {batchUpdate.isPending || batchCreate.isPending ? "Salvando..." : "Salvar Alteracoes"}
          </Button>
        </div>
      )}

      {/* Cancel confirmation */}
      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alteracoes?</AlertDialogTitle>
            <AlertDialogDescription>Voce tem alteracoes nao salvas. Deseja descartar todas as mudancas?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import errors */}
      <Dialog open={importErrorsOpen} onOpenChange={setImportErrorsOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Erros na importacao</DialogTitle></DialogHeader>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {importErrors.map((err, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <Badge variant="destructive" className="shrink-0">Linha {err.line}</Badge>
                <span className="text-muted-foreground">{err.reason}</span>
              </div>
            ))}
          </div>
          <DialogFooter><Button onClick={() => setImportErrorsOpen(false)}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
