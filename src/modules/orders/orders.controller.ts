import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import { idSchema } from "../../shared/id.schema";
import * as orders from "./orders.service";

const createSchema = z.strictObject({
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

const updateSchema = z.strictObject({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

const handleError = (error: unknown, res: Response) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025")
      return res.status(404).json({ error: "Pedido no encontrado" });
    if (error.code === "P2003")
      return res
        .status(409)
        .json({ error: "Empresa o producto ya no disponible" });
  }
  return res.status(500).json({ error: "Error interno del servidor" });
};

export const create = async (req: Request, res: Response) => {
  const input = createSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Datos de pedido inválidos" });
  try {
    const result = await orders.createOrder(input.data);
    if ("reason" in result) {
      if (result.reason === "company-not-found") {
        return res.status(404).json({ error: "Empresa no encontrada" });
      }
      return res
        .status(400)
        .json({ error: "Uno o más productos no existen o no están activos" });
    }
    return res.status(201).json(result.order);
  } catch (error) {
    return handleError(error, res);
  }
};

export const list = async (_req: Request, res: Response) => {
  try {
    return res.json(await orders.listOrders());
  } catch (error) {
    return handleError(error, res);
  }
};

export const get = async (req: Request, res: Response) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de pedido inválido" });
  try {
    const order = await orders.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
    return res.json(order);
  } catch (error) {
    return handleError(error, res);
  }
};

export const update = async (req: Request, res: Response) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de pedido inválido" });
  const input = updateSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Datos de pedido inválidos" });
  try {
    return res.json(await orders.updateOrder(req.params.id, input.data.status));
  } catch (error) {
    return handleError(error, res);
  }
};

export const remove = async (req: Request, res: Response) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de pedido inválido" });
  try {
    if (!(await orders.deleteOrder(req.params.id)))
      return res.status(404).json({ error: "Pedido no encontrado" });
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};
