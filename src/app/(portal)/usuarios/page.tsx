"use client";
import { useState } from "react";
import { useUsers, useCreateUser, useDeleteUser } from "@/hooks/use-users";
import { useCondominiums } from "@/hooks/use-condominiums";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Trash2, UserCog, Copy } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/types/user";

const roleLabels: Record<UserRole, string> = { ADM: "Administrador", CLIENT_ADM: "Admin Condominio", SUPPORT: "Suporte" };

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const { data: condominiums } = useCondominiums();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("CLIENT_ADM");
  const [condominiumId, setCondominiumId] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const filtered = users?.filter((u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) ?? [];

  async function handleCreate() {
    try {
      const result = await createUser.mutateAsync({
        name,
        email,
        role,
        condominium_id: (role === "CLIENT_ADM") ? condominiumId : undefined,
      });
      setTempPassword(result.temp_password);
      toast.success("Usuario criado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteUser.mutateAsync(id);
      toast.success("Usuario excluido");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  function resetForm() {
    setName(""); setEmail(""); setRole("CLIENT_ADM"); setCondominiumId(""); setTempPassword("");
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Novo Usuario</Button>} />
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Novo Usuario</DialogTitle><DialogDescription>Uma senha temporaria sera gerada.</DialogDescription></DialogHeader>
            {tempPassword ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Usuario criado. Senha temporaria:</p>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <code className="text-sm font-mono flex-1">{tempPassword}</code>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success("Copiado"); }}><Copy className="size-4" /></Button>
                </div>
                <Button className="w-full" onClick={() => { setOpen(false); resetForm(); }}>Fechar</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                {currentUser?.role === "ADM" && (
                  <>
                    <div className="space-y-2">
                      <Label>Perfil</Label>
                      <Select value={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        <SelectItem value="ADM">Administrador</SelectItem>
                        <SelectItem value="CLIENT_ADM">Admin Condominio</SelectItem>
                        <SelectItem value="SUPPORT">Suporte</SelectItem>
                      </SelectContent></Select>
                    </div>
                    {role === "CLIENT_ADM" && (
                      <div className="space-y-2">
                        <Label>Condominio</Label>
                        <Select value={condominiumId} onValueChange={setCondominiumId}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>
                          {condominiums?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent></Select>
                      </div>
                    )}
                  </>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreate} disabled={!name || !email || createUser.isPending}>{createUser.isPending ? "Criando..." : "Criar"}</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><UserCog className="size-12 mb-4 opacity-50" /><p>Nenhum usuario encontrado</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Perfil</TableHead><TableHead>Condominio</TableHead><TableHead>Status</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{roleLabels[u.role] || u.role}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{u.condominium?.name || "-"}</TableCell>
                    <TableCell><Badge variant={u.active ? "default" : "secondary"}>{u.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}><Trash2 className="size-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
