"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/format";

interface AuditLog { id: string; user_id?: string; action: string; resource: string; method: string; endpoint: string; response_status: number; ip_address?: string; created_at: string }

export default function AuditoriaPage() {
  const { data: logs, isLoading } = useQuery({ queryKey: ["audit"], queryFn: () => apiClient.get<AuditLog[]>("/api/audit") });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Auditoria</h1>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? <Skeleton className="h-48 w-full" /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Acao</TableHead><TableHead>Recurso</TableHead><TableHead>Metodo</TableHead><TableHead>Endpoint</TableHead><TableHead>Status</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
              <TableBody>{logs?.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground text-xs">{formatDateTime(log.created_at)}</TableCell>
                  <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                  <TableCell className="text-sm">{log.resource}</TableCell>
                  <TableCell><Badge variant="secondary">{log.method}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{log.endpoint}</TableCell>
                  <TableCell><Badge variant={log.response_status < 400 ? "default" : "destructive"}>{log.response_status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.ip_address}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
