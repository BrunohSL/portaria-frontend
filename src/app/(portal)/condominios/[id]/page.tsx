"use client";
import { use } from "react";
import Link from "next/link";
import { useCondominium } from "@/hooks/use-condominiums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Home, Users, GitBranch, Pencil } from "lucide-react";
import { formatPhone, formatCnpj } from "@/lib/format";
import { UnitsTab } from "@/components/condominiums/units-tab";
import { ResidentsTab } from "@/components/condominiums/residents-tab";
import { FlowsTab } from "@/components/condominiums/flows-tab";

export default function CondominiumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: condominium, isLoading } = useCondominium(id);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!condominium) return <p className="text-muted-foreground">Condominio nao encontrado</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{condominium.name}</h1>
          <p className="text-sm text-muted-foreground">{condominium.city}{condominium.state ? ` - ${condominium.state}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <Badge variant={condominium.active ? "default" : "secondary"}>{condominium.active ? "Ativo" : "Inativo"}</Badge>
          <Link href={`/condominios/${id}/editar`}><Button variant="outline" size="sm"><Pencil className="size-4 mr-1" /> Editar</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">CNPJ</CardTitle></CardHeader><CardContent><p className="text-sm">{formatCnpj(condominium.cnpj)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Telefone</CardTitle></CardHeader><CardContent><p className="text-sm">{formatPhone(condominium.phone)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Nomenclatura</CardTitle></CardHeader><CardContent><p className="text-sm">{condominium.level1_label} / {condominium.level2_label}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Twilio</CardTitle></CardHeader><CardContent><p className="text-sm">{condominium.twilio_phone_number || "Nao configurado"}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units"><Home className="size-4 mr-1" /> Unidades</TabsTrigger>
          <TabsTrigger value="residents"><Users className="size-4 mr-1" /> Moradores</TabsTrigger>
          <TabsTrigger value="flows"><GitBranch className="size-4 mr-1" /> Fluxos</TabsTrigger>
        </TabsList>
        <TabsContent value="units"><UnitsTab condominiumId={id} condominium={condominium} /></TabsContent>
        <TabsContent value="residents"><ResidentsTab condominiumId={id} /></TabsContent>
        <TabsContent value="flows"><FlowsTab condominiumId={id} /></TabsContent>
      </Tabs>
    </div>
  );
}
