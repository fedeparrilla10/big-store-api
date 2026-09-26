import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import * as products from "./products.service";

const productSchema = z.strictObject({
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

const updateSchema = productSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0);

const idSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const handleError = (error: unknown, res: Response) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res
        .status(409)
        .json({
          error:
            "No se puede guardar el producto porque este SKU ya está utilizado",
        });
      return;
    }
    if (error.code === "P2025") {
      res.status(404).json({ error: "Producto no encontrado" });
      return;
    }
  }
  res.status(500).json({ error: "Error interno del servidor" });
};

export const create = async (req: Request, res: Response) => {
  const input = productSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Datos de producto inválidos" });
  try {
    return res.status(201).json(await products.createProduct(input.data));
  } catch (error) {
    handleError(error, res);
  }
};

export const list = async (_req: Request, res: Response) => {
  try {
    return res.json(await products.listProducts());
  } catch (error) {
    handleError(error, res);
  }
};

export const get = async (req: Request, res: Response) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de producto inválido" });
  try {
    const product = await products.getProduct(req.params.id);
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });
    return res.json(product);
  } catch (error) {
    handleError(error, res);
  }
};

export const update = async (req: Request, res: Response) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de producto inválido" });
  const input = updateSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Datos de producto inválidos" });
  try {
    return res.json(await products.updateProduct(req.params.id, input.data));
  } catch (error) {
    handleError(error, res);
  }
};

export const remove = async (req: Request, res: Response) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de producto inválido" });
  try {
    if (!(await products.deleteProduct(req.params.id))) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};
