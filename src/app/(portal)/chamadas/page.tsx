"use client";
import { useState } from "react";
import Link from "next/link";
import { useCallSessions } from "@/hooks/use-calls";
import { useCondominiums } from "@/hooks/use-condominiums";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone } from "lucide-react";
import { formatDateTime, formatDuration, formatPhone } from "@/lib/format";
import type { CallStatus } from "@/types/call";

const statusLabels: Record<CallStatus, string> = { queued: "Na fila", in_progress: "Em andamento", completed: "Concluida", failed: "Falhou", transferred: "Transferida", abandoned: "Abandonada" };
const statusVariants: Record<CallStatus, "default" | "secondary" | "destructive" | "outline"> = { queued: "outline", in_progress: "default", completed: "secondary", failed: "destructive", transferred: "outline", abandoned: "destructive" };

export default function ChamadasPage() {
  const { user } = useAuth();
  const { data: condominiums } = useCondominiums();
  const [selectedCondominium, setSelectedCondominium] = useState<string>(user?.condominium_id || "");
  const { data: sessions, isLoading } = useCallSessions({ condominium_id: selectedCondominium || undefined });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Chamadas</h1>
      {user?.role === "ADM" && (
        <Select value={selectedCondominium} onValueChange={setSelectedCondominium}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Selecione o condominio" /></SelectTrigger>
          <SelectContent>{condominiums?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
        </Select>
      )}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <Skeleton className="h-48 w-full" /> : !sessions?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground"><Phone className="size-12 mb-4 opacity-50" /><p>Nenhuma chamada encontrada</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>Numero</TableHead><TableHead>Status</TableHead><TableHead>Fluxo</TableHead><TableHead>Duracao</TableHead><TableHead>Inicio</TableHead></TableRow></TableHeader>
              <TableBody>{sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium"><Link href={`/chamadas/${s.id}`} className="hover:underline">{formatPhone(s.caller_number)}</Link></TableCell>
                  <TableCell><Badge variant={statusVariants[s.status]}>{statusLabels[s.status]}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{s.flow?.name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDuration(s.duration_seconds)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(s.started_at)}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
