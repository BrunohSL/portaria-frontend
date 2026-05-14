"use client";
import { use } from "react";
import { useCallSession, useCallSessionLogs } from "@/hooks/use-calls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone } from "lucide-react";
import { formatDateTime, formatDuration, formatPhone } from "@/lib/format";
import Link from "next/link";
import type { CallStatus } from "@/types/call";

const statusLabels: Record<CallStatus, string> = { queued: "Na fila", in_progress: "Em andamento", completed: "Concluida", failed: "Falhou", transferred: "Transferida", abandoned: "Abandonada" };
const statusVariants: Record<CallStatus, "default" | "secondary" | "destructive" | "outline"> = { queued: "outline", in_progress: "default", completed: "secondary", failed: "destructive", transferred: "outline", abandoned: "destructive" };

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, isLoading } = useCallSession(id);
  const { data: logs } = useCallSessionLogs(id);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!session) return <p className="text-muted-foreground">Chamada nao encontrada</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/chamadas"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">{formatPhone(session.caller_number)}</h1>
          <div className="flex gap-2 mt-1">
            <Badge variant={statusVariants[session.status]}>{statusLabels[session.status]}</Badge>
            {session.flow && <Badge variant="outline">{session.flow.name}</Badge>}
            {session.condominium && <span className="text-sm text-muted-foreground">{session.condominium.name}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Inicio</CardTitle></CardHeader><CardContent><p className="text-sm">{formatDateTime(session.started_at)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Fim</CardTitle></CardHeader><CardContent><p className="text-sm">{formatDateTime(session.ended_at)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Duracao</CardTitle></CardHeader><CardContent><p className="text-sm">{formatDuration(session.duration_seconds)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Twilio SID</CardTitle></CardHeader><CardContent><p className="text-xs font-mono truncate">{session.twilio_call_sid || "-"}</p></CardContent></Card>
      </div>

      {session.summary && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Resumo (IA)</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{session.summary}</p></CardContent>
        </Card>
      )}

      {session.error_message && (
        <Card className="border-destructive">
          <CardHeader><CardTitle className="text-sm text-destructive">Erro</CardTitle></CardHeader>
          <CardContent><p className="text-sm">{session.error_message}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Timeline de Eventos</CardTitle></CardHeader>
        <CardContent>
          {!logs?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum evento registrado</p>
          ) : (
            <div className="relative space-y-0">
              {logs.map((log, i) => (
                <div key={log.id} className="flex gap-4 pb-4">
                  <div className="flex flex-col items-center">
                    <div className="size-3 rounded-full bg-primary mt-1.5" />
                    {i < logs.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{log.event_type}</Badge>
                      {log.node && <span className="text-xs text-muted-foreground">Node: {log.node.type}</span>}
                      <span className="text-xs text-muted-foreground ml-auto">{formatDateTime(log.created_at)}</span>
                    </div>
                    {log.payload && (
                      <pre className="mt-1 text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto">{JSON.stringify(log.payload, null, 2)}</pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
