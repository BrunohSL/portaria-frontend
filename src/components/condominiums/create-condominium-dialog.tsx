"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { condominiumSchema, type CondominiumFormData } from "@/schemas/condominium.schema";
import { useCreateCondominium } from "@/hooks/use-condominiums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateCondominiumDialog() {
  const [open, setOpen] = useState(false);
  const createCondominium = useCreateCondominium();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CondominiumFormData>({ resolver: zodResolver(condominiumSchema), defaultValues: { level1_label: "Bloco", level2_label: "Apto" } });

  async function onSubmit(data: CondominiumFormData) {
    try {
      await createCondominium.mutateAsync(data);
      toast.success("Condominio criado com sucesso");
      reset();
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar condominio");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Novo Condominio</Button>} />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Novo Condominio</DialogTitle><DialogDescription>Preencha os dados do condominio</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...register("name")} placeholder="Nome do condominio" />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
            <div className="space-y-2"><Label>CNPJ</Label><Input {...register("cnpj")} placeholder="00.000.000/0000-00" /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input {...register("phone")} placeholder="(00) 00000-0000" /></div>
            <div className="space-y-2 col-span-2"><Label>Endereco</Label><Input {...register("address")} /></div>
            <div className="space-y-2"><Label>Cidade</Label><Input {...register("city")} /></div>
            <div className="space-y-2"><Label>Estado</Label><Input {...register("state")} /></div>
            <div className="space-y-2"><Label>CEP</Label><Input {...register("zip_code")} /></div>
            <div className="space-y-2"><Label>Numero Twilio</Label><Input {...register("twilio_phone_number")} /></div>
            <div className="space-y-2"><Label>Label Nivel 1</Label><Input {...register("level1_label")} placeholder="Ex: Bloco" /></div>
            <div className="space-y-2"><Label>Label Nivel 2</Label><Input {...register("level2_label")} placeholder="Ex: Apto" /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createCondominium.isPending}>{createCondominium.isPending ? "Criando..." : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
