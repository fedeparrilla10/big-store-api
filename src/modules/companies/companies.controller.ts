import { NextFunction, Request, Response } from "express";
import { idSchema } from "../../shared/id.schema";
import { companySchema } from "./companies.schema";
import * as companies from "./companies.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const input = companySchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Datos de empresa inválidos" });
  try {
    return res.status(201).json(await companies.createCompany(input.data));
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
    return res.json(await companies.listCompanies());
  } catch (error) {
    next(error);
  }
};

export const get = async (req: Request, res: Response, next: NextFunction) => {
  if (!idSchema.safeParse(req.params.id).success)
    return res.status(400).json({ error: "ID de empresa inválido" });
  try {
    const company = await companies.getCompany(req.params.id);
    if (!company)
      return res.status(404).json({ error: "Empresa no encontrada" });
    return res.json(company);
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
    return res.status(400).json({ error: "ID de empresa inválido" });
  const input = companySchema.safeParse(req.body);
  if (!input.success)
    return res.status(400).json({ error: "Datos de empresa inválidos" });
  try {
    return res.json(await companies.updateCompany(req.params.id, input.data));
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
    return res.status(400).json({ error: "ID de empresa inválido" });
  try {
    await companies.deleteCompany(req.params.id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
