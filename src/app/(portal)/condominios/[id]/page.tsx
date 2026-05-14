"use client";
import { use } from "react";
import Link from "next/link";
import { useCondominium } from "@/hooks/use-condominiums";
import { useGates } from "@/hooks/use-gates";
import { useExtensions } from "@/hooks/use-extensions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Home, Users, Pencil, Settings, DoorOpen, Phone, AlertTriangle } from "lucide-react";
import { formatPhone, formatCnpj } from "@/lib/format";
import { UnitsTab } from "@/components/condominiums/units-tab";
import { ContactsTab } from "@/components/condominiums/contacts-tab";
import { EmployeesCard } from "@/components/condominiums/employees-card";
import { FlowsCard } from "@/components/condominiums/flows-card";

export default function CondominiumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: condominium, isLoading } = useCondominium(id);
  const { data: gates } = useGates(id);
  const { data: extensions } = useExtensions(id);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!condominium) return <p className="text-muted-foreground">Condominio nao encontrado</p>;

  const gatesList = (gates ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const extensionsList = extensions ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{condominium.name}</h1>
          <p className="text-sm text-muted-foreground">
            {[condominium.address, condominium.city, condominium.state].filter(Boolean).join(", ") || "Endereco nao informado"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={condominium.active ? "default" : "secondary"}>{condominium.active ? "Ativo" : "Inativo"}</Badge>
          <Link href={`/condominios/${id}/editar`}><Button variant="outline" size="sm"><Pencil className="size-4 mr-1" /> Editar</Button></Link>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">CNPJ</CardTitle></CardHeader><CardContent><p className="text-sm">{formatCnpj(condominium.cnpj)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Telefone</CardTitle></CardHeader><CardContent><p className="text-sm">{formatPhone(condominium.phone)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Nomenclatura</CardTitle></CardHeader><CardContent><p className="text-sm">{condominium.level1_label} / {condominium.level2_label}</p></CardContent></Card>
      </div>

      {/* Infraestrutura */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="size-5 text-muted-foreground" />
              <CardTitle>Infraestrutura</CardTitle>
            </div>
            <Link href={`/condominios/${id}/configuracoes`}>
              <Button variant="outline" size="sm"><Pencil className="size-4 mr-1" /> Editar</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {gatesList.length === 0 && extensionsList.length === 0 && !condominium.fallback_extension ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <AlertTriangle className="size-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma infraestrutura configurada</p>
              <Link href={`/condominios/${id}/configuracoes`}>
                <Button variant="link" size="sm" className="mt-1">Configurar agora</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Portoes */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <DoorOpen className="size-4 text-muted-foreground" /> Portoes
                </h4>
                {gatesList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum portao configurado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>DNS</TableHead>
                        <TableHead>Ramal</TableHead>
                        <TableHead>Marca</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gatesList.map((gate) => (
                        <TableRow key={gate.id}>
                          <TableCell className="font-mono text-xs text-muted-foreground">{gate.position ?? "-"}</TableCell>
                          <TableCell className="font-medium">{gate.label || gate.slug}</TableCell>
                          <TableCell className="font-mono text-xs">{gate.dns ?? "-"}</TableCell>
                          <TableCell>{gate.extension ?? "-"}</TableCell>
                          <TableCell className="text-muted-foreground">{gate.brand ?? "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Ramais + Fallback */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" /> Ramais
                </h4>
                {extensionsList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum ramal configurado</p>
                ) : (
                  <div className="space-y-2">
                    {extensionsList.map((ext) => (
                      <div key={ext.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-muted/50">
                        <span className="text-sm">{ext.name}</span>
                        <Badge variant="outline" className="font-mono">{ext.number}</Badge>
                      </div>
                    ))}
                  </div>
                )}

                {condominium.fallback_extension && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-500" /> Ramal de Fallback
                    </h4>
                    <div className="flex items-center gap-2 py-1.5 px-3 rounded-lg bg-amber-500/10">
                      <span className="text-sm text-muted-foreground">Em caso de falha, transferir para:</span>
                      <Badge variant="outline" className="font-mono">{condominium.fallback_extension}</Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funcionarios */}
      <EmployeesCard condominiumId={id} />

      {/* Fluxos */}
      <FlowsCard condominiumId={id} />

      {/* Tabs */}
      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units"><Home className="size-4 mr-1" /> Unidades</TabsTrigger>
          <TabsTrigger value="contacts"><Users className="size-4 mr-1" /> Contatos</TabsTrigger>
        </TabsList>
        <TabsContent value="units"><UnitsTab condominiumId={id} condominium={condominium} /></TabsContent>
        <TabsContent value="contacts"><ContactsTab condominiumId={id} condominium={condominium} /></TabsContent>
      </Tabs>
    </div>
  );
}
