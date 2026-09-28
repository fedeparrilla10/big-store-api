import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({ error: "Recurso no encontrado" });
      return;
    }
    if (error.code === "P2002") {
      const target = error.meta?.target;
      res.status(409).json({
        error:
          Array.isArray(target) && target.includes("sku")
            ? "No se puede guardar el producto porque este SKU ya está utilizado"
            : "Ya existe un registro con esos datos",
      });
      return;
    }
    if (error.code === "P2003") {
      res.status(409).json({
        error: "La operación entra en conflicto con datos existentes",
      });
      return;
    }
  }

  res.status(500).json({ error: "Error interno del servidor" });
};
