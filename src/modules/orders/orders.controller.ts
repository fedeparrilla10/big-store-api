import { NextFunction, Request, Response } from "express";
import { idSchema } from "../../shared/id.schema";
import { createOrderSchema, updateOrderSchema } from "./orders.schema";
import * as orders from "./orders.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = createOrderSchema.safeParse(req.body);
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
    next(error);
  }
};

export const list = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    return res.json(await orders.listOrders());
  } catch (error) {
    next(error);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de pedido inválido" });
  try {
    const order = await orders.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
    return res.json(order);
  } catch (error) {
    next(error);
  }
};

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de pedido inválido" });
  const input = updateOrderSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Datos de pedido inválidos" });
  try {
    return res.json(await orders.updateOrder(req.params.id, input.data.status));
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de pedido inválido" });
  try {
    if (!(await orders.deleteOrder(req.params.id)))
      return res.status(404).json({ error: "Pedido no encontrado" });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
