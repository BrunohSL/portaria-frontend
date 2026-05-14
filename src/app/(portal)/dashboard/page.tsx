"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useSeedDatabase } from "@/hooks/use-seed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Building2, Phone, Users, Database } from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user } = useAuth();
  const seed = useSeedDatabase();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleSeed() {
    try {
      const result = await seed.mutateAsync();
      toast.success(`Banco populado: 1 condominio, ${result.units} unidades, ${result.contacts} contatos`);
      setConfirmOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao popular banco");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo, {user?.name}</p>
        </div>
        {user?.role === "ADM" && (
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger render={
              <Button variant="outline" size="sm" disabled={seed.isPending}>
                <Database className="size-4 mr-2" /> {seed.isPending ? "Populando..." : "Popular banco"}
              </Button>
            } />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Popular banco com dados de teste?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acao vai <strong>apagar todos os condominios, unidades e contatos existentes</strong> e criar um conjunto de dados de teste:
                  <br /><br />
                  • 1 condominio (Bloco/Apto, fallback 3010, 3 portoes, 2 ramais)<br />
                  • 12 unidades (A-F, 101-102)<br />
                  • 12 contatos distribuidos
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSeed}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Condominios</CardTitle><Building2 className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">-</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Chamadas Hoje</CardTitle><Phone className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">-</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Contatos</CardTitle><Users className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">-</div></CardContent></Card>
      </div>
    </div>
  );
}
