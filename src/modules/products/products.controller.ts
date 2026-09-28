import { NextFunction, Request, Response } from "express";
import { idSchema } from "../../shared/id.schema";
import { productSchema, updateProductSchema } from "./products.schema";
import * as products from "./products.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = productSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Datos de producto inválidos" });
  try {
    return res.status(201).json(await products.createProduct(input.data));
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
    return res.json(await products.listProducts());
  } catch (error) {
    next(error);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de producto inválido" });
  try {
    const product = await products.getProduct(req.params.id);
    if (!product)
      return res.status(404).json({ error: "Producto no encontrado" });
    return res.json(product);
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
    return res.status(400).json({ error: "ID de producto inválido" });
  const input = updateProductSchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Datos de producto inválidos" });
  try {
    return res.json(await products.updateProduct(req.params.id, input.data));
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
    return res.status(400).json({ error: "ID de producto inválido" });
  try {
    if (!(await products.deleteProduct(req.params.id))) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
