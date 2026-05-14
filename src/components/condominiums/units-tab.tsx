"use client";
import { useState, useRef } from "react";
import { useUnits, useCreateUnit, useDeleteUnit, useBatchUpdateUnits, useImportUnits } from "@/hooks/use-units";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, PencilOff, Save, Upload, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import type { Condominium } from "@/types/condominium";

interface EditableUnit {
  id: string;
  level1_value: string;
  level2_value: string;
}

export function UnitsTab({ condominiumId, condominium }: { condominiumId: string; condominium: Condominium }) {
  const { data: units } = useUnits(condominiumId);
  const createUnit = useCreateUnit(condominiumId);
  const deleteUnit = useDeleteUnit(condominiumId);
  const batchUpdate = useBatchUpdateUnits(condominiumId);
  const importUnits = useImportUnits(condominiumId);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<EditableUnit[]>([]);
  const [newRows, setNewRows] = useState<{ tempId: string; level1_value: string; level2_value: string }[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  // CSV import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<{ line: number; reason: string }[]>([]);
  const [importErrorsOpen, setImportErrorsOpen] = useState(false);

  function enterEditMode() {
    setEditData((units || []).map((u) => ({
      id: u.id,
      level1_value: u.level1_value,
      level2_value: u.level2_value,
    })));
    setNewRows([]);
    setHasChanges(false);
    setEditing(true);
  }

  function addNewRow() {
    setNewRows((prev) => [...prev, { tempId: `new-${Date.now()}`, level1_value: "", level2_value: "" }]);
    setHasChanges(true);
  }

  function updateNewRow(tempId: string, field: "level1_value" | "level2_value", value: string) {
    setNewRows((prev) => prev.map((r) => r.tempId === tempId ? { ...r, [field]: value } : r));
    setHasChanges(true);
  }

  function removeNewRow(tempId: string) {
    setNewRows((prev) => prev.filter((r) => r.tempId !== tempId));
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

  function updateField(id: string, field: keyof EditableUnit, value: string) {
    setEditData((prev) =>
      prev.map((u) => (u.id === id ? { ...u, [field]: value } : u))
    );
    setHasChanges(true);
  }

  async function handleSave() {
    const changes = editData.filter((edited) => {
      const original = (units || []).find((u) => u.id === edited.id);
      if (!original) return false;
      return (
        original.level1_value !== edited.level1_value ||
        original.level2_value !== edited.level2_value
      );
    });

    const validNewRows = newRows.filter((r) => r.level1_value && r.level2_value);

    if (changes.length === 0 && validNewRows.length === 0) {
      toast.info("Nenhuma alteracao detectada");
      setEditing(false);
      return;
    }

    try {
      if (changes.length > 0) {
        await batchUpdate.mutateAsync(changes);
      }
      for (const row of validNewRows) {
        await createUnit.mutateAsync({ level1_value: row.level1_value, level2_value: row.level2_value });
      }
      const msgs = [];
      if (changes.length > 0) msgs.push(`${changes.length} atualizada(s)`);
      if (validNewRows.length > 0) msgs.push(`${validNewRows.length} criada(s)`);
      toast.success(msgs.join(", "));
      setEditing(false);
      setHasChanges(false);
      setNewRows([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  async function handleCreate() {
    try {
      await createUnit.mutateAsync({ level1_value: l1, level2_value: l2 });
      toast.success("Unidade criada");
      setCreateOpen(false);
      setL1("");
      setL2("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleDelete(unitId: string) {
    try {
      await deleteUnit.mutateAsync(unitId);
      toast.success("Unidade excluida");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  function downloadTemplate() {
    const header = `${condominium.level1_label},${condominium.level2_label}`;
    const example = `A,101\nA,102\nB,201\nB,202`;
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_unidades.csv";
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
      return { level1_value: cols[0] || "", level2_value: cols[1] || "" };
    }).filter((r) => r.level1_value || r.level2_value);

    if (rows.length === 0) {
      toast.error("Nenhuma unidade encontrada no arquivo");
      return;
    }

    try {
      const result = await importUnits.mutateAsync(rows);
      if (result.errors.length > 0) {
        setImportErrors(result.errors);
        setImportErrorsOpen(true);
        toast.warning(`${result.created} criada(s), ${result.errors.length} erro(s)`);
      } else {
        toast.success(`${result.created} unidade(s) importada(s)`);
      }
      setImportFile(null);
      setImportOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar");
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
            disabled={false}
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
                <DialogTitle>Importar Unidades</DialogTitle>
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
                <Button onClick={handleImportSubmit} disabled={!importFile || importUnits.isPending}>
                  <Upload className="size-4 mr-1" /> {importUnits.isPending ? "Importando..." : "Importar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button size="sm" disabled={editing}><Plus className="size-4 mr-1" /> Nova Unidade</Button>} />
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Unidade</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>{condominium.level1_label}</Label><Input value={l1} onChange={(e) => setL1(e.target.value)} placeholder="Ex: A" /></div>
                <div className="space-y-2"><Label>{condominium.level2_label}</Label><Input value={l2} onChange={(e) => setL2(e.target.value)} placeholder="Ex: 101" /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button><Button onClick={handleCreate} disabled={!l1 || !l2}>Criar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{condominium.level1_label}</TableHead>
              <TableHead>{condominium.level2_label}</TableHead>
              <TableHead>Moradores</TableHead>
              {!editing && <TableHead className="w-12"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {editing ? (<>
              {editData.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Input
                      value={u.level1_value}
                      onChange={(e) => updateField(u.id, "level1_value", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={u.level2_value}
                      onChange={(e) => updateField(u.id, "level2_value", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {units?.find((ou) => ou.id === u.id)?.contacts?.length ?? 0}
                  </TableCell>
                </TableRow>
              ))}
              {/* Novas linhas */}
              {newRows.map((row) => (
                <TableRow key={row.tempId} className="bg-emerald-500/5">
                  <TableCell>
                    <Input
                      value={row.level1_value}
                      onChange={(e) => updateNewRow(row.tempId, "level1_value", e.target.value)}
                      className="h-8 text-sm"
                      placeholder={condominium.level1_label}
                      autoFocus={newRows[newRows.length - 1]?.tempId === row.tempId}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={row.level2_value}
                      onChange={(e) => updateNewRow(row.tempId, "level2_value", e.target.value)}
                      className="h-8 text-sm"
                      placeholder={condominium.level2_label}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">Nova</Badge>
                      <Button variant="ghost" size="icon" className="ml-auto" onClick={() => removeNewRow(row.tempId)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {/* Botão + */}
              <TableRow>
                <TableCell colSpan={3}>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground" onClick={addNewRow}>
                    <Plus className="size-4 mr-1" /> Adicionar unidade
                  </Button>
                </TableCell>
              </TableRow>
            </>
            ) : (
              units?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.level1_value}</TableCell>
                  <TableCell>{u.level2_value}</TableCell>
                  <TableCell className="text-muted-foreground">{u.contacts?.length ?? 0}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            {!units?.length && !editing && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Nenhuma unidade cadastrada
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
            {editData.length} existente(s){newRows.length > 0 && ` + ${newRows.length} nova(s)`} {hasChanges && "— alteracoes pendentes"}
          </span>
          <Button variant="outline" onClick={tryExitEditMode}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!hasChanges || batchUpdate.isPending}>
            <Save className="size-4 mr-1" /> {batchUpdate.isPending ? "Salvando..." : "Salvar Alteracoes"}
          </Button>
        </div>
      )}

      {/* Cancel confirmation */}
      <AlertDialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alteracoes?</AlertDialogTitle>
            <AlertDialogDescription>
              Voce tem alteracoes nao salvas. Deseja descartar todas as mudancas?
            </AlertDialogDescription>
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
