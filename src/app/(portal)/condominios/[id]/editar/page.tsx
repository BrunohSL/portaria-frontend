"use client";
import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { condominiumSchema, type CondominiumFormData } from "@/schemas/condominium.schema";
import { useCondominium, useUpdateCondominium } from "@/hooks/use-condominiums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { maskPhone, maskCnpj } from "@/lib/format";
import Link from "next/link";

export default function EditCondominiumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: condo, isLoading } = useCondominium(id);
  const updateCondo = useUpdateCondominium(id);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CondominiumFormData>({
    resolver: zodResolver(condominiumSchema),
  });

  useEffect(() => {
    if (condo) {
      reset({
        name: condo.name,
        cnpj: maskCnpj(condo.cnpj || ""),
        phone: maskPhone(condo.phone || ""),
        address: condo.address || "",
        city: condo.city || "",
        state: condo.state || "",
        zip_code: condo.zip_code || "",
        fallback_extension: condo.fallback_extension || "",
      });
    }
  }, [condo, reset]);

  async function onSubmit(data: CondominiumFormData) {
    try {
      await updateCondo.mutateAsync(data);
      toast.success("Condominio atualizado");
      router.push(`/condominios/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar");
    }
  }

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-48 w-full" /></div>;
  if (!condo) return <p className="text-muted-foreground">Condominio nao encontrado</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/condominios/${id}`}><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
        <h1 className="text-2xl font-bold">Editar — {condo.name}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Nome</Label><Input {...register("name")} />{errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}</div>
              <div className="space-y-2"><Label>CNPJ</Label><Input {...register("cnpj", { onChange: (e) => { const masked = maskCnpj(e.target.value); setValue("cnpj", masked); e.target.value = masked; } })} placeholder="00.000.000/0000-00" maxLength={18} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input {...register("phone", { onChange: (e) => { const masked = maskPhone(e.target.value); setValue("phone", masked); e.target.value = masked; } })} placeholder="(00) 00000-0000" maxLength={15} /></div>
              <div className="space-y-2 col-span-2"><Label>Endereco</Label><Input {...register("address")} /></div>
              <div className="space-y-2"><Label>Cidade</Label><Input {...register("city")} /></div>
              <div className="space-y-2"><Label>Estado</Label><Input {...register("state")} /></div>
              <div className="space-y-2"><Label>CEP</Label><Input {...register("zip_code")} /></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Portões, ramais e nomenclatura (bloco/apto) ficam em <Link href={`/condominios/${id}/configuracoes`} className="underline hover:text-foreground">Configurações de infraestrutura</Link>.
            </p>
            <div className="flex gap-3 justify-end">
              <Link href={`/condominios/${id}`}><Button type="button" variant="outline">Cancelar</Button></Link>
              <Button type="submit" disabled={updateCondo.isPending}>{updateCondo.isPending ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
