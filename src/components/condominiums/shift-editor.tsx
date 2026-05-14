"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCreateShift, useDeleteShift } from "@/hooks/use-employee-shifts";
import { DAY_LABELS, formatTimeShort, shiftSummary } from "@/lib/shift";
import type { Employee, EmployeeShift, ShiftType } from "@/types/employee";

interface Props {
  condominiumId: string;
  employee: Employee;
}

export function ShiftEditor({ condominiumId, employee }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<ShiftType>("WEEKLY");
  const createShift = useCreateShift(condominiumId, employee.id);
  const deleteShift = useDeleteShift(condominiumId, employee.id);

  // Form WEEKLY
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [weekStart, setWeekStart] = useState("08:00");
  const [weekEnd, setWeekEnd] = useState("17:00");

  // Form ROTATION
  const [rotationDate, setRotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [rotationPeriod, setRotationPeriod] = useState<number>(2);
  const [rotStart, setRotStart] = useState("07:00");
  const [rotEnd, setRotEnd] = useState("19:00");

  function toggleDay(day: number) {
    setWeekDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort());
  }

  async function handleAddWeekly() {
    if (weekDays.length === 0) {
      toast.error("Selecione ao menos um dia da semana");
      return;
    }
    if (!weekStart || !weekEnd) {
      toast.error("Informe horario de inicio e fim");
      return;
    }
    try {
      await createShift.mutateAsync({
        type: "WEEKLY",
        days_of_week: weekDays,
        start_time: weekStart,
        end_time: weekEnd,
      });
      toast.success("Horario adicionado");
      setWeekDays([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleAddRotation() {
    if (!rotationDate || !rotationPeriod || rotationPeriod < 1) {
      toast.error("Informe data inicial e periodo (em dias)");
      return;
    }
    try {
      await createShift.mutateAsync({
        type: "ROTATION",
        rotation_start_date: rotationDate,
        rotation_period_days: rotationPeriod,
        start_time: rotStart,
        end_time: rotEnd,
      });
      toast.success("Rotacao adicionada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  async function handleDelete(shiftId: string) {
    try {
      await deleteShift.mutateAsync(shiftId);
      toast.success("Horario removido");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  const shifts = employee.shifts || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="h-8">
          <Clock className="size-3.5 mr-1" />
          {shifts.length === 0 ? "Definir" : `${shifts.length} turno(s)`}
        </Button>
      } />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Horarios — {employee.name}</DialogTitle>
        </DialogHeader>

        {/* Lista de shifts atuais */}
        {shifts.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Turnos cadastrados</Label>
            {shifts.map((s: EmployeeShift) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg border">
                <Badge variant="outline" className="text-xs">{s.type === "WEEKLY" ? "Semanal" : "Rotacao"}</Badge>
                <span className="text-sm flex-1">{shiftSummary(s)}</span>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Adicionar novo turno */}
        <div className="space-y-3 border-t pt-4">
          <Label className="text-xs text-muted-foreground">Adicionar turno</Label>
          <Tabs value={tab} onValueChange={(v) => setTab(v as ShiftType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="WEEKLY">Semanal (CLT)</TabsTrigger>
              <TabsTrigger value="ROTATION">Rotacao (12x36)</TabsTrigger>
            </TabsList>

            <TabsContent value="WEEKLY" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label className="text-sm">Dias da semana</Label>
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs border transition-colors",
                        weekDays.includes(i)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:bg-accent"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Inicio</Label>
                  <Input type="time" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Fim</Label>
                  <Input type="time" value={weekEnd} onChange={(e) => setWeekEnd(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleAddWeekly} disabled={createShift.isPending} className="w-full">
                <Plus className="size-4 mr-1" /> Adicionar turno semanal
              </Button>
            </TabsContent>

            <TabsContent value="ROTATION" className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">
                Use este modo para escalas como 12x36. Informe quando o ciclo comeca e a cada quantos dias o funcionario trabalha.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Data inicial do ciclo</Label>
                  <Input type="date" value={rotationDate} onChange={(e) => setRotationDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">A cada N dias</Label>
                  <Input type="number" min="1" value={rotationPeriod} onChange={(e) => setRotationPeriod(parseInt(e.target.value) || 1)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">Inicio do turno</Label>
                  <Input type="time" value={rotStart} onChange={(e) => setRotStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Fim do turno</Label>
                  <Input type="time" value={rotEnd} onChange={(e) => setRotEnd(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ex: comeca em 01/01, periodo 2 dias, 07:00–19:00 → trabalha 01/01, 03/01, 05/01... Se o fim for menor que o inicio (ex: 19:00–07:00), o turno vira para o dia seguinte.
              </p>
              <Button onClick={handleAddRotation} disabled={createShift.isPending} className="w-full">
                <Plus className="size-4 mr-1" /> Adicionar rotacao
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
