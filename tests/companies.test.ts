import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@prisma/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@prisma/client")>();
  return {
    ...original,
    PrismaClient: class {
      company = db;
    },
  };
});

import { Prisma } from "@prisma/client";
import { app } from "../src/app";

const id = "a1498994-7b18-4ad3-9a69-7966ef8b907b";
const row = {
  id,
  name: "Tienda",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};
const company = {
  ...row,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
};
const prismaError = (code: string) => new Prisma.PrismaClientKnownRequestError("Database error", {
  code,
  clientVersion: "6.19.3",
});

beforeEach(() => vi.resetAllMocks());

describe("/companies", () => {
  it("creates a company with a trimmed name", async () => {
    db.create.mockResolvedValue(row);
    const response = await request(app).post("/companies").send({ name: " Tienda " });
    expect(response.status).toBe(201);
    expect(response.body).toEqual(company);
    expect(db.create).toHaveBeenCalledWith({ data: { name: "Tienda" } });
  });

  it.each([{}, { name: "  " }, { name: 12 }, { name: "Tienda", createdAt: "2026-01-01" }, { name: "Tienda", updatedAt: "2026-01-01" }])(
    "rejects invalid create input: %j", async (body) => {
      expect((await request(app).post("/companies").send(body)).status).toBe(400);
      expect(db.create).not.toHaveBeenCalled();
    },
  );

  it("lists companies", async () => {
    db.findMany.mockResolvedValue([row]);
    const response = await request(app).get("/companies");
    expect(response.status).toBe(200);
    expect(response.body).toEqual([company]);
    expect(db.findMany).toHaveBeenCalledOnce();
  });

  it("gets a company or returns 404", async () => {
    db.findUnique.mockResolvedValueOnce(row).mockResolvedValueOnce(null);
    expect((await request(app).get(`/companies/${id}`)).body).toEqual(company);
    expect(db.findUnique).toHaveBeenCalledWith({ where: { id } });
    expect((await request(app).get(`/companies/${id}`)).status).toBe(404);
  });

  it("updates a company", async () => {
    const updatedAt = new Date("2026-01-02T00:00:00Z");
    db.update.mockResolvedValue({ ...row, name: "Nueva", updatedAt });
    const response = await request(app).patch(`/companies/${id}`).send({ name: " Nueva " });
    expect(response.status).toBe(200);
    expect(response.body.name).toBe("Nueva");
    expect(response.body.updatedAt).toBe(updatedAt.toISOString());
    expect(db.update).toHaveBeenCalledWith({ where: { id }, data: { name: "Nueva" } });
  });

  it.each([{}, { name: "  " }, { name: "Nueva", id }, { name: "Nueva", updatedAt: "2026-01-01" }])(
    "rejects invalid update input: %j", async (body) => {
      expect((await request(app).patch(`/companies/${id}`).send(body)).status).toBe(400);
      expect(db.update).not.toHaveBeenCalled();
    },
  );

  it("returns 404 when updating a missing company", async () => {
    db.update.mockRejectedValue(prismaError("P2025"));
    expect((await request(app).patch(`/companies/${id}`).send({ name: "Nueva" })).status).toBe(404);
  });

  it("deletes a company, returning 404 if missing", async () => {
    db.delete.mockResolvedValueOnce(row).mockRejectedValueOnce(prismaError("P2025"));
    expect((await request(app).delete(`/companies/${id}`)).status).toBe(204);
    expect(db.delete).toHaveBeenCalledWith({ where: { id } });
    expect((await request(app).delete(`/companies/${id}`)).status).toBe(404);
  });

  it("does not delete a company with associated orders", async () => {
    db.delete.mockRejectedValue(prismaError("P2003"));
    const response = await request(app).delete(`/companies/${id}`);
    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/pedidos asociados/);
  });

  it("rejects malformed IDs", async () => {
    expect((await request(app).get("/companies/invalid")).status).toBe(400);
    expect((await request(app).get("/companies/a1498994-7b18-4ad3-0a69-7966ef8b907b")).status).toBe(400);
    expect((await request(app).patch("/companies/invalid").send({ name: "Nueva" })).status).toBe(400);
    expect((await request(app).delete("/companies/invalid")).status).toBe(400);
    expect(db.findUnique).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("does not expose unexpected database errors", async () => {
    db.findMany.mockRejectedValue(new Error("database credentials"));
    const response = await request(app).get("/companies");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Error interno del servidor" });
  });
});
