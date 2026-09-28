import { z } from "zod";
import { idSchema } from "../../shared/id.schema";

export const createOrderSchema = z.strictObject({
  companyId: idSchema,
  items: z
    .array(
      z.strictObject({
        productId: idSchema,
        quantity: z.number().int().positive().max(2_147_483_647),
      }),
    )
    .min(1)
    .refine(
      (items) =>
        new Set(items.map((item) => item.productId)).size === items.length,
    ),
});

export const updateOrderSchema = z.strictObject({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});
