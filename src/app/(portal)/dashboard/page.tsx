"use client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Phone, Users } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Bem-vindo, {user?.name}</p>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Condominios</CardTitle><Building2 className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">-</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Chamadas Hoje</CardTitle><Phone className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">-</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Moradores</CardTitle><Users className="size-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">-</div></CardContent></Card>
      </div>
    </div>
  );
}
