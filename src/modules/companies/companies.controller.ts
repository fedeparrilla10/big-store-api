import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import * as companies from "./companies.service";

const companySchema = z.strictObject({ name: z.string().trim().min(1) });
const idSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

const handleError = (error: unknown, res: Response) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") return res.status(404).json({ error: "Empresa no encontrada" });
    if (error.code === "P2003") return res.status(409).json({ error: "No se puede eliminar la empresa porque tiene pedidos asociados" });
  }
  return res.status(500).json({ error: "Error interno del servidor" });
};

export const create = async (req: Request, res: Response) => {
  const input = companySchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "Datos de empresa inválidos" });
  try {
    return res.status(201).json(await companies.createCompany(input.data));
  } catch (error) {
    return handleError(error, res);
  }
};

export const list = async (_req: Request, res: Response) => {
  try {
    return res.json(await companies.listCompanies());
  } catch (error) {
    return handleError(error, res);
  }
};

export const get = async (req: Request, res: Response) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: "ID de empresa inválido" });
  try {
    const company = await companies.getCompany(req.params.id);
    if (!company) return res.status(404).json({ error: "Empresa no encontrada" });
    return res.json(company);
  } catch (error) {
    return handleError(error, res);
  }
};

export const update = async (req: Request, res: Response) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: "ID de empresa inválido" });
  const input = companySchema.safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: "Datos de empresa inválidos" });
  try {
    return res.json(await companies.updateCompany(req.params.id, input.data));
  } catch (error) {
    return handleError(error, res);
  }
};

export const remove = async (req: Request, res: Response) => {
  if (!idSchema.safeParse(req.params.id).success) return res.status(400).json({ error: "ID de empresa inválido" });
  try {
    await companies.deleteCompany(req.params.id);
    return res.status(204).send();
  } catch (error) {
    return handleError(error, res);
  }
};
