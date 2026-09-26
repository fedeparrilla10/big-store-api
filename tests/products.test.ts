import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

vi.mock("@prisma/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@prisma/client")>();
  return {
    ...original,
    PrismaClient: class {
      product = db;
    },
  };
});

import { Prisma } from "@prisma/client";
import { app } from "../src/app";

const id = "a1498994-7b18-4ad3-9a69-7966ef8b907b";
const row = {
  id,
  sku: "ABC-1",
  name: "Camiseta",
  status: "inactive",
  price: new Prisma.Decimal("15.99"),
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  deletedAt: null,
};
const product = {
  id,
  sku: "ABC-1",
  name: "Camiseta",
  status: "inactive",
  price: "15.99",
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
};

beforeEach(() => vi.resetAllMocks());

describe("/products", () => {
  it("creates a product with a decimal price", async () => {
    db.create.mockResolvedValue(row);
    const response = await request(app)
      .post("/products")
      .send({ sku: "ABC-1", name: "Camiseta", price: 15.99 });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(product);
    expect(db.create).toHaveBeenCalledWith({
      data: { sku: "ABC-1", name: "Camiseta", price: 15.99 },
    });
  });

  it("returns a conflict for a reserved SKU, even when its product was deleted", async () => {
    db.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "6.19.3",
        meta: { target: ["sku"] },
      }),
    );
    const response = await request(app)
      .post("/products")
      .send({ sku: "ABC-1", name: "Nueva", price: 10 });

    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/SKU ya está utilizado/);
  });

  it.each([
    { sku: "ABC-1", name: "Camiseta" },
    { sku: "", name: "Camiseta", price: 15.99 },
    { sku: "ABC-1", name: "   ", price: 15.99 },
    { sku: "ABC-1", name: "Camiseta", price: 15.999 },
    { sku: "ABC-1", name: "Camiseta", price: -1 },
    { sku: "ABC-1", name: "Camiseta", price: 1_000_000_001 },
    { sku: "ABC-1", name: "Camiseta", price: "15.99" },
    { sku: "ABC-1", name: "Camiseta", price: 10, status: "pending" },
    { sku: "ABC-1", name: "Camiseta", price: 10, deletedAt: null },
  ])("rejects invalid create input: %j", async (body) => {
    expect((await request(app).post("/products").send(body)).status).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  });

  it("lists only non-deleted products", async () => {
    db.findMany.mockResolvedValue([row]);
    const response = await request(app).get("/products");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([product]);
    expect(db.findMany).toHaveBeenCalledWith({ where: { deletedAt: null } });
  });

  it("gets a non-deleted product or returns 404", async () => {
    db.findFirst.mockResolvedValueOnce(row).mockResolvedValueOnce(null);
    expect((await request(app).get(`/products/${id}`)).body).toEqual(product);
    expect(db.findFirst).toHaveBeenCalledWith({
      where: { id, deletedAt: null },
    });
    expect((await request(app).get(`/products/${id}`)).status).toBe(404);
  });

  it("updates only a non-deleted product", async () => {
    db.update.mockResolvedValue({
      ...row,
      price: new Prisma.Decimal("20.00"),
      status: "active",
    });
    const response = await request(app)
      .patch(`/products/${id}`)
      .send({ price: 20, status: "active" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ price: "20", status: "active" });
    expect(db.update).toHaveBeenCalledWith({
      where: { id, deletedAt: null },
      data: { sku: undefined, name: undefined, price: 20, status: "active" },
    });
  });

  it("returns 404 when updating a deleted or missing product", async () => {
    db.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Not found", {
        code: "P2025",
        clientVersion: "6.19.3",
      }),
    );
    expect(
      (await request(app).patch(`/products/${id}`).send({ name: "Nuevo" }))
        .status,
    ).toBe(404);
  });

  it.each([
    {},
    { name: "   " },
    { price: 12.345 },
    { status: "pending" },
    { deletedAt: null },
  ])("rejects invalid update input: %j", async (body) => {
    expect(
      (await request(app).patch(`/products/${id}`).send(body)).status,
    ).toBe(400);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("returns 409 when updating to a SKU already in use", async () => {
    db.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "6.19.3",
        meta: { target: ["sku"] },
      }),
    );
    const response = await request(app)
      .patch(`/products/${id}`)
      .send({ sku: "RESERVED" });
    expect(response.status).toBe(409);
    expect(response.body.error).toMatch(/SKU ya está utilizado/);
  });

  it("soft deletes a product and returns 404 if already deleted", async () => {
    db.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    expect((await request(app).delete(`/products/${id}`)).status).toBe(204);
    expect(db.updateMany).toHaveBeenCalledWith({
      where: { id, deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
    expect((await request(app).delete(`/products/${id}`)).status).toBe(404);
  });

  it("rejects malformed IDs and empty updates", async () => {
    expect((await request(app).get("/products/not-a-uuid")).status).toBe(400);
    expect((await request(app).delete("/products/not-a-uuid")).status).toBe(
      400,
    );
    expect((await request(app).patch(`/products/${id}`).send({})).status).toBe(
      400,
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it("does not expose unexpected database errors", async () => {
    db.findMany.mockRejectedValue(new Error("database credentials"));
    const response = await request(app).get("/products");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Error interno del servidor" });
  });
});
