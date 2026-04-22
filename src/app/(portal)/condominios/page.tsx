"use client";
import { useState } from "react";
import Link from "next/link";
import { useCondominiums, useDeleteCondominium } from "@/hooks/use-condominiums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2 } from "lucide-react";
import { toast } from "sonner";
import { CreateCondominiumDialog } from "@/components/condominiums/create-condominium-dialog";

export default function CondominiosPage() {
  const { data: condominiums, isLoading } = useCondominiums();
  const [search, setSearch] = useState("");
  const deleteCondominium = useDeleteCondominium();

  const filtered = condominiums?.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Condominios</h1>
        <CreateCondominiumDialog />
      </div>
      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="size-12 mb-4 opacity-50" />
              <p>Nenhum condominio encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Labels</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><Link href={`/condominios/${c.id}`} className="font-medium hover:underline">{c.name}</Link></TableCell>
                    <TableCell className="text-muted-foreground">{c.city || "-"}</TableCell>
                    <TableCell><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.level1_label} / {c.level2_label}</TableCell>
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
