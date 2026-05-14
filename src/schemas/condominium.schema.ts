import { z } from "zod";
export const condominiumSchema = z.object({
  name: z.string().min(2, "Nome obrigatorio"),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  fallback_extension: z.string().optional(),
});
export type CondominiumFormData = z.infer<typeof condominiumSchema>;
