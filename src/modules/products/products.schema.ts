import { z } from "zod";

export const productSchema = z.strictObject({
  sku: z.string().trim().min(1),
  name: z.string().trim().min(1),
  status: z.enum(["active", "inactive"]).optional(),
  price: z
    .number()
    .finite()
    .min(0)
    .max(1_000_000_000)
    .refine((price) => Number(price.toFixed(2)) === price),
});

export const updateProductSchema = productSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0);
