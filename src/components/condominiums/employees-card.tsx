"use client";
import { useState, useRef } from "react";
import {
  useEmployees,
  useCreateEmployee,
  useDeleteEmployee,
  useEmployeeRoles,
  useBatchUpdateEmployees,
  useImportEmployees,
} from "@/hooks/use-employees";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, PencilOff, Save, Users, Upload, Download, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatPhone, maskPhone } from "@/lib/format";
import { isEmployeeOnDuty } from "@/lib/shift";
import { ShiftEditor } from "@/components/condominiums/shift-editor";
import type { Employee } from "@/types/employee";

interface EmergencyEditorProps {
  active: boolean;
  phone: string;
  employees: Employee[];
  onChange: (active: boolean, phone: string) => void;
}

function EmergencyEditor({ active, phone, employees, onChange }: EmergencyEditorProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"contact" | "manual">("contact");
  const candidates = employees.filter((e) => e.phone);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button variant={active ? "default" : "outline"} size="sm" className="h-8">
          <AlertTriangle className="size-3.5 mr-1" />
          {active ? (phone ? formatPhone(phone) : "Sem telefone") : "Inativo"}
        </Button>
      } />
      <PopoverContent className="w-80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm">Modo emergencia</Label>
            <p className="text-xs text-muted-foreground">
              Liga para o contato em vez do funcionario
            </p>
          </div>
          <Switch
            checked={active}
            onCheckedChange={(v) => onChange(v, v ? phone : "")}
          />
        </div>

        {active && (
          <div className="space-y-3 pt-2 border-t">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "contact" ? "default" : "outline"}
                onClick={() => setMode("contact")}
                className="flex-1"
              >
                Outro funcionario
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "manual" ? "default" : "outline"}
                onClick={() => setMode("manual")}
                className="flex-1"
              >
                Telefone manual
              </Button>
            </div>

            {mode === "contact" ? (
              <Select value={phone} onValueChange={(v) => onChange(true, v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Selecione um funcionario" /></SelectTrigger>
                <SelectContent>
                  {candidates.map((e) => (
                    <SelectItem key={e.id} value={e.phone || ""}>
                      {e.name}{e.role?.label ? ` (${e.role.label})` : ""} — {formatPhone(e.phone)}
                    </SelectItem>
                  ))}
                  {!candidates.length && (
                    <div className="p-2 text-xs text-muted-foreground">Nenhum outro funcionario com telefone cadastrado</div>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={maskPhone(phone)}
                onChange={(e) => onChange(true, maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface EditableEmployee {
  id: string;
  name: string;
  phone: string;
  role_id: string;
  can_authorize_access: boolean;
  emergency_active: boolean;
  emergency_phone: string;
  active: boolean;
}

interface NewEmployee {
  tempId: string;
  name: string;
  phone: string;
  role_id: string;
  can_authorize_access: boolean;
  emergency_active: boolean;
  emergency_phone: string;
}

export function EmployeesCard({ condominiumId }: { condominiumId: string }) {
  const { data: employees } = useEmployees(condominiumId);
  const { data: roles } = useEmployeeRoles();
  const createEmployee = useCreateEmployee(condominiumId);
  const deleteEmployee = useDeleteEmployee(condominiumId);
  const batchUpdate = useBatchUpdateEmployees(condominiumId);
  const importEmployees = useImportEmployees(condominiumId);

  // Modo edicao
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<EditableEmployee[]>([]);
  const [newRows, setNewRows] = useState<NewEmployee[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  // Import CSV
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<{ line: number; reason: string }[]>([]);
  const [importErrorsOpen, setImportErrorsOpen] = useState(false);

  // Novo funcionario (dialog individual)
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRoleId, setNewRoleId] = useState("");
  const [newCanAuthorize, setNewCanAuthorize] = useState(false);
  const [newEmergencyActive, setNewEmergencyActive] = useState(false);
  const [newEmergencyMode, setNewEmergencyMode] = useState<"contact" | "manual">("contact");
  const [newEmergencyPhone, setNewEmergencyPhone] = useState("");

  function resetCreateForm() {
    setNewName("");
    setNewPhone("");
    setNewRoleId("");
    setNewCanAuthorize(false);
    setNewEmergencyActive(false);
    setNewEmergencyMode("contact");
    setNewEmergencyPhone("");
  }

  async function handleCreate() {
    if (!newName || !newRoleId) {
      toast.error("Preencha nome e cargo");
      return;
    }
    if (newEmergencyActive && !newEmergencyPhone) {
      toast.error("Selecione um contato ou digite um telefone de emergencia");
      return;
    }
    try {
      await createEmployee.mutateAsync({
        name: newName,
        phone: newPhone.replace(/\D/g, "") || undefined,
        role_id: newRoleId,
        can_authorize_access: newCanAuthorize,
        emergency_active: newEmergencyActive,
        emergency_phone: newEmergencyActive ? newEmergencyPhone.replace(/\D/g, "") : null,
      });
      toast.success("Funcionario criado");
      setCreateOpen(false);
      resetCreateForm();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar");
    }
  }

  function enterEditMode() {
    setEditData((employees || []).map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone || "",
      role_id: e.role_id,
      can_authorize_access: e.can_authorize_access,
      emergency_active: e.emergency_active,
      emergency_phone: e.emergency_phone || "",
      active: e.active,
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

  function updateField<K extends keyof EditableEmployee>(id: string, field: K, value: EditableEmployee[K]) {
    setEditData((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    setHasChanges(true);
  }

  function addNewRow() {
    setNewRows((prev) => [...prev, { tempId: `new-${Date.now()}`, name: "", phone: "", role_id: roles?.[0]?.id || "", can_authorize_access: false, emergency_active: false, emergency_phone: "" }]);
    setHasChanges(true);
  }

  function updateNewRow<K extends keyof NewEmployee>(tempId: string, field: K, value: NewEmployee[K]) {
    setNewRows((prev) => prev.map((r) => r.tempId === tempId ? { ...r, [field]: value } : r));
    setHasChanges(true);
  }

  function removeNewRow(tempId: string) {
    setNewRows((prev) => prev.filter((r) => r.tempId !== tempId));
  }

  async function handleSave() {
    const changes = editData.filter((edited) => {
      const original = (employees || []).find((e) => e.id === edited.id);
      if (!original) return false;
      return (
        original.name !== edited.name ||
        (original.phone || "") !== edited.phone ||
        original.role_id !== edited.role_id ||
        original.can_authorize_access !== edited.can_authorize_access ||
        original.emergency_active !== edited.emergency_active ||
        (original.emergency_phone || "") !== edited.emergency_phone ||
        original.active !== edited.active
      );
    }).map((e) => ({
      id: e.id,
      name: e.name,
      phone: e.phone.replace(/\D/g, "") || null,
      role_id: e.role_id,
      can_authorize_access: e.can_authorize_access,
      emergency_active: e.emergency_active,
      emergency_phone: e.emergency_active ? e.emergency_phone.replace(/\D/g, "") : null,
      active: e.active,
    }));

    const validNew = newRows.filter((r) => r.name && r.role_id);

    if (changes.length === 0 && validNew.length === 0) {
      toast.info("Nenhuma alteracao detectada");
      setEditing(false);
      return;
    }

    try {
      if (changes.length > 0) {
        await batchUpdate.mutateAsync(changes);
      }
      for (const row of validNew) {
        await createEmployee.mutateAsync({
          name: row.name,
          phone: row.phone.replace(/\D/g, "") || undefined,
          role_id: row.role_id,
          can_authorize_access: row.can_authorize_access,
          emergency_active: row.emergency_active,
          emergency_phone: row.emergency_active ? row.emergency_phone.replace(/\D/g, "") : null,
        });
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
      await deleteEmployee.mutateAsync(id);
      toast.success("Funcionario excluido");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  // CSV
  function downloadTemplate() {
    const header = "nome,telefone,cargo,libera_acesso";
    const examples = [
      "Maria Silva,11987654321,sindico,true",
      "Joao Santos,11912345678,porteiro,true",
      "Ana Costa,11999998888,faxineira,false",
      "Pedro Lima,11988887777,zelador,false",
    ].join("\n");
    const csv = `${header}\n${examples}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_funcionarios.csv";
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
        name: cols[0] || "",
        phone: cols[1] || "",
        role: cols[2] || "",
        can_authorize_access: cols[3] || "",
      };
    }).filter((r) => r.name || r.role);

    if (rows.length === 0) {
      toast.error("Nenhum funcionario encontrado no arquivo");
      return;
    }

    try {
      const result = await importEmployees.mutateAsync(rows);
      if (result.errors.length > 0) {
        setImportErrors(result.errors);
        setImportErrorsOpen(true);
        toast.warning(`${result.created} criado(s), ${result.errors.length} erro(s)`);
      } else {
        toast.success(`${result.created} funcionario(s) importado(s)`);
      }
      setImportFile(null);
      setImportOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao importar");
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            Funcionarios
          </CardTitle>
          <CardDescription>Gestao de funcionarios do condominio (sindico, porteiro, faxineira, etc.)</CardDescription>
        </div>
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
                  <DialogTitle>Importar Funcionarios</DialogTitle>
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

                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><strong>Colunas:</strong> nome, telefone, cargo, libera_acesso</p>
                    <p><strong>Cargos validos:</strong> {roles?.map((r) => r.key).join(", ")}</p>
                    <p><strong>Libera acesso:</strong> true, false, sim, nao</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)}>Cancelar</Button>
                  <Button onClick={handleImportSubmit} disabled={!importFile || importEmployees.isPending}>
                    <Upload className="size-4 mr-1" /> {importEmployees.isPending ? "Importando..." : "Importar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={createOpen} onOpenChange={(v) => { setCreateOpen(v); if (!v) resetCreateForm(); }}>
              <DialogTrigger render={<Button size="sm" disabled={editing}><Plus className="size-4 mr-1" /> Novo Funcionario</Button>} />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Funcionario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={maskPhone(newPhone)} onChange={(e) => setNewPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Select value={newRoleId} onValueChange={(v) => setNewRoleId(v ?? "")}>
                      <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                      <SelectContent>
                        {roles?.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Libera acesso</Label>
                      <p className="text-xs text-muted-foreground">
                        Funcionario pode autorizar entrada de visitantes
                      </p>
                    </div>
                    <Switch checked={newCanAuthorize} onCheckedChange={setNewCanAuthorize} />
                  </div>

                  {/* Modo emergencia */}
                  <div className="space-y-3 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Modo emergencia</Label>
                        <p className="text-xs text-muted-foreground">
                          Quando ativo, o sistema liga para o contato de emergencia em vez do funcionario
                        </p>
                      </div>
                      <Switch checked={newEmergencyActive} onCheckedChange={(v) => { setNewEmergencyActive(v); if (!v) setNewEmergencyPhone(""); }} />
                    </div>

                    {newEmergencyActive && (
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={newEmergencyMode === "contact" ? "default" : "outline"}
                            onClick={() => { setNewEmergencyMode("contact"); setNewEmergencyPhone(""); }}
                            className="flex-1"
                          >
                            Outro funcionario
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={newEmergencyMode === "manual" ? "default" : "outline"}
                            onClick={() => { setNewEmergencyMode("manual"); setNewEmergencyPhone(""); }}
                            className="flex-1"
                          >
                            Telefone manual
                          </Button>
                        </div>

                        {newEmergencyMode === "contact" ? (
                          <Select
                            value={newEmergencyPhone}
                            onValueChange={(v) => setNewEmergencyPhone(v ?? "")}
                          >
                            <SelectTrigger><SelectValue placeholder="Selecione um funcionario" /></SelectTrigger>
                            <SelectContent>
                              {employees?.filter((e) => e.phone).map((e) => (
                                <SelectItem key={e.id} value={e.phone || ""}>
                                  {e.name}{e.role?.label ? ` (${e.role.label})` : ""} — {formatPhone(e.phone)}
                                </SelectItem>
                              ))}
                              {!employees?.filter((e) => e.phone).length && (
                                <div className="p-2 text-xs text-muted-foreground">Nenhum outro funcionario com telefone cadastrado</div>
                              )}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={maskPhone(newEmergencyPhone)}
                            onChange={(e) => setNewEmergencyPhone(maskPhone(e.target.value))}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={!newName || !newRoleId || createEmployee.isPending}>
                    {createEmployee.isPending ? "Criando..." : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Libera Acesso</TableHead>
                <TableHead>Emergencia</TableHead>
                {!editing && <TableHead>Horarios</TableHead>}
                {!editing && <TableHead>Status</TableHead>}
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editing ? (<>
                {editData.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <Input value={emp.name} onChange={(e) => updateField(emp.id, "name", e.target.value)} className="h-8 text-sm" />
                    </TableCell>
                    <TableCell>
                      <Select value={emp.role_id} onValueChange={(v) => updateField(emp.id, "role_id", v ?? "")}>
                        <SelectTrigger className="h-8 text-sm w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {roles?.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={maskPhone(emp.phone)}
                        onChange={(e) => updateField(emp.id, "phone", maskPhone(e.target.value))}
                        className="h-8 text-sm"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={emp.can_authorize_access} onCheckedChange={(v) => updateField(emp.id, "can_authorize_access", v)} />
                    </TableCell>
                    <TableCell>
                      <EmergencyEditor
                        active={emp.emergency_active}
                        phone={emp.emergency_phone}
                        employees={(employees || []).filter((e) => e.id !== emp.id)}
                        onChange={(active, phone) => {
                          updateField(emp.id, "emergency_active", active);
                          updateField(emp.id, "emergency_phone", phone);
                        }}
                      />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))}
                {newRows.map((row) => (
                  <TableRow key={row.tempId} className="bg-emerald-500/5">
                    <TableCell>
                      <Input
                        value={row.name}
                        onChange={(e) => updateNewRow(row.tempId, "name", e.target.value)}
                        className="h-8 text-sm"
                        placeholder="Nome do funcionario"
                        autoFocus={newRows[newRows.length - 1]?.tempId === row.tempId}
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={row.role_id} onValueChange={(v) => updateNewRow(row.tempId, "role_id", v ?? "")}>
                        <SelectTrigger className="h-8 text-sm w-36"><SelectValue placeholder="Cargo" /></SelectTrigger>
                        <SelectContent>
                          {roles?.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={maskPhone(row.phone)}
                        onChange={(e) => updateNewRow(row.tempId, "phone", maskPhone(e.target.value))}
                        className="h-8 text-sm"
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch checked={row.can_authorize_access} onCheckedChange={(v) => updateNewRow(row.tempId, "can_authorize_access", v)} />
                    </TableCell>
                    <TableCell>
                      <EmergencyEditor
                        active={row.emergency_active}
                        phone={row.emergency_phone}
                        employees={employees || []}
                        onChange={(active, phone) => {
                          updateNewRow(row.tempId, "emergency_active", active);
                          updateNewRow(row.tempId, "emergency_phone", phone);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => removeNewRow(row.tempId)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={6}>
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground hover:text-foreground" onClick={addNewRow}>
                      <Plus className="size-4 mr-1" /> Adicionar funcionario
                    </Button>
                  </TableCell>
                </TableRow>
              </>) : (
                employees?.map((emp: Employee) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.name}</TableCell>
                    <TableCell><Badge variant="outline">{emp.role?.label || "-"}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{formatPhone(emp.phone)}</TableCell>
                    <TableCell>
                      {emp.can_authorize_access
                        ? <Badge variant="default">Sim</Badge>
                        : <Badge variant="secondary">Nao</Badge>}
                    </TableCell>
                    <TableCell>
                      {emp.emergency_active && emp.emergency_phone
                        ? <Badge variant="default" className="gap-1"><AlertTriangle className="size-3" /> {formatPhone(emp.emergency_phone)}</Badge>
                        : <span className="text-xs text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>
                      <ShiftEditor condominiumId={condominiumId} employee={emp} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={emp.active ? "default" : "secondary"}>{emp.active ? "Ativo" : "Inativo"}</Badge>
                        {emp.active && isEmployeeOnDuty(emp.shifts) && (
                          <span className="inline-flex size-2 rounded-full bg-emerald-500" title="No plantao agora" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)} title="Excluir">
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!employees?.length && !editing && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum funcionario cadastrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Save bar */}
        {editing && (
          <div className="flex items-center justify-end gap-3 p-3 mt-4 rounded-lg border bg-muted/50 sticky bottom-0">
            <span className="text-sm text-muted-foreground mr-auto">
              {editData.length} existente(s){newRows.length > 0 && ` + ${newRows.length} novo(s)`} {hasChanges && "— alteracoes pendentes"}
            </span>
            <Button variant="outline" onClick={tryExitEditMode}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!hasChanges || batchUpdate.isPending || createEmployee.isPending}>
              <Save className="size-4 mr-1" /> {batchUpdate.isPending || createEmployee.isPending ? "Salvando..." : "Salvar Alteracoes"}
            </Button>
          </div>
        )}
      </CardContent>

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
    </Card>
  );
}
