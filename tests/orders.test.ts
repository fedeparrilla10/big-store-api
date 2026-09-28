import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => ({
  db: {
    company: { findUnique: vi.fn() },
    product: { findMany: vi.fn() },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@prisma/client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@prisma/client")>();
  return {
    ...original,
    PrismaClient: class {
      company = db.company;
      product = db.product;
      order = db.order;
      $transaction = (callback: (tx: typeof db) => Promise<unknown>) => callback(db);
    },
  };
});

import { Prisma } from "@prisma/client";
import { app } from "../src/app";

const companyId = "a1498994-7b18-4ad3-9a69-7966ef8b907b";
const productId = "c1498994-7b18-4ad3-9a69-7966ef8b907b";
const orderId = "b1498994-7b18-4ad3-9a69-7966ef8b907b";
const date = new Date("2026-01-01T00:00:00Z");
const input = { companyId, items: [{ productId, quantity: 2 }] };
const row = {
  id: orderId,
  companyId,
  status: "pending",
  total: new Prisma.Decimal("31.98"),
  createdAt: date,
  updatedAt: date,
  deletedAt: null,
  items: [{ id: "item-id", productId, sku: "ABC-1", productName: "Camiseta", quantity: 2, unitPrice: new Prisma.Decimal("15.99") }],
};
const responseOrder = {
  id: orderId,
  companyId,
  status: "pending",
  total: "31.98",
  createdAt: date.toISOString(),
  updatedAt: date.toISOString(),
  items: [{ id: "item-id", productId, sku: "ABC-1", productName: "Camiseta", quantity: 2, unitPrice: "15.99" }],
};

beforeEach(() => vi.resetAllMocks());

describe("/orders", () => {
  it("creates an order from active products, snapshotting prices and calculating the total", async () => {
    db.company.findUnique.mockResolvedValue({ id: companyId });
    db.product.findMany.mockResolvedValue([{ id: productId, sku: "ABC-1", name: "Camiseta", price: new Prisma.Decimal("15.99") }]);
    db.order.create.mockResolvedValue(row);

    const response = await request(app).post("/orders").send(input);
    expect(response.status).toBe(201);
    expect(response.body).toEqual(responseOrder);
    expect(db.product.findMany).toHaveBeenCalledWith({
      where: { id: { in: [productId] }, status: "active", deletedAt: null },
    });
    expect(db.order.create).toHaveBeenCalledWith({
      data: {
        companyId,
        total: new Prisma.Decimal("31.98"),
        items: { create: [{ productId, quantity: 2, sku: "ABC-1", productName: "Camiseta", unitPrice: new Prisma.Decimal("15.99") }] },
      },
      include: { items: true },
    });
  });

  it("rejects a missing company or unavailable product before creating", async () => {
    db.company.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: companyId });
    db.product.findMany.mockResolvedValue([]);
    const missingCompany = await request(app).post("/orders").send(input);
    expect(missingCompany.status).toBe(404);
    expect(missingCompany.body).toEqual({ error: "Empresa no encontrada" });
    const unavailableProduct = await request(app).post("/orders").send(input);
    expect(unavailableProduct.status).toBe(400);
    expect(unavailableProduct.body).toEqual({ error: "Uno o más productos no existen o no están activos" });
    expect(db.order.create).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { companyId, items: [] },
    { companyId, items: [{ productId, quantity: 0 }] },
    { companyId, items: [{ productId, quantity: 1.5 }] },
    { companyId, items: [{ productId, quantity: 2_147_483_648 }] },
    { companyId, items: [{ productId, quantity: 1 }, { productId, quantity: 2 }] },
    { companyId, items: [{ productId, quantity: 1, unitPrice: 0 }] },
    { companyId: "invalid", items: [{ productId, quantity: 1 }] },
  ])("rejects invalid creation input: %j", async (body) => {
    expect((await request(app).post("/orders").send(body)).status).toBe(400);
    expect(db.order.create).not.toHaveBeenCalled();
  });

  it("calculates small decimal prices without rounding errors", async () => {
    db.company.findUnique.mockResolvedValue({ id: companyId });
    db.product.findMany.mockResolvedValue([{ id: productId, sku: "ABC-1", name: "Camiseta", price: new Prisma.Decimal("0.10") }]);
    db.order.create.mockResolvedValue({
      ...row,
      total: new Prisma.Decimal("0.30"),
      items: [{ ...row.items[0], quantity: 3, unitPrice: new Prisma.Decimal("0.10") }],
    });
    const response = await request(app).post("/orders").send({ companyId, items: [{ productId, quantity: 3 }] });
    expect(response.status).toBe(201);
    expect(response.body.total).toBe("0.3");
    expect(db.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ total: new Prisma.Decimal("0.3") }),
    }));
  });

  it("lists and retrieves only non-deleted orders", async () => {
    db.order.findMany.mockResolvedValue([row]);
    db.order.findFirst.mockResolvedValueOnce(row).mockResolvedValueOnce(null);
    expect((await request(app).get("/orders")).body).toEqual([responseOrder]);
    expect(db.order.findMany).toHaveBeenCalledWith({ where: { deletedAt: null }, include: { items: true } });
    expect((await request(app).get(`/orders/${orderId}`)).body).toEqual(responseOrder);
    expect(db.order.findFirst).toHaveBeenCalledWith({ where: { id: orderId, deletedAt: null }, include: { items: true } });
    expect((await request(app).get(`/orders/${orderId}`)).status).toBe(404);
  });

  it("changes only the status and rejects changes to items or total", async () => {
    db.order.update.mockResolvedValue({ ...row, status: "confirmed" });
    const response = await request(app).patch(`/orders/${orderId}`).send({ status: "confirmed" });
    expect(response.body).toEqual({ ...responseOrder, status: "confirmed" });
    expect(db.order.update).toHaveBeenCalledWith({
      where: { id: orderId, deletedAt: null }, data: { status: "confirmed" }, include: { items: true },
    });
    for (const body of [{}, { status: "other" }, { status: "pending", items: [] }, { total: 0 }]) {
      expect((await request(app).patch(`/orders/${orderId}`).send(body)).status).toBe(400);
    }
    expect(db.order.update).toHaveBeenCalledOnce();
  });

  it("returns 404 when updating a missing or deleted order", async () => {
    db.order.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025", clientVersion: "6.19.3",
    }));
    expect((await request(app).patch(`/orders/${orderId}`).send({ status: "cancelled" })).status).toBe(404);
  });

  it("returns a generic conflict if a company or product disappears while creating", async () => {
    db.company.findUnique.mockResolvedValue({ id: companyId });
    db.product.findMany.mockResolvedValue([{ id: productId, sku: "ABC-1", name: "Camiseta", price: new Prisma.Decimal("15.99") }]);
    db.order.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Foreign key", {
      code: "P2003", clientVersion: "6.19.3",
    }));

    const response = await request(app).post("/orders").send(input);
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "La operación entra en conflicto con datos existentes" });
  });

  it("soft deletes once and rejects invalid IDs", async () => {
    db.order.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    expect((await request(app).delete(`/orders/${orderId}`)).status).toBe(204);
    expect(db.order.updateMany).toHaveBeenCalledWith({
      where: { id: orderId, deletedAt: null }, data: { deletedAt: expect.any(Date) },
    });
    expect((await request(app).delete(`/orders/${orderId}`)).status).toBe(404);
    expect((await request(app).get("/orders/invalid")).status).toBe(400);
    expect((await request(app).patch("/orders/invalid").send({ status: "pending" })).status).toBe(400);
    expect((await request(app).delete("/orders/invalid")).status).toBe(400);
  });

  it("does not expose database errors", async () => {
    db.order.findMany.mockRejectedValue(new Error("database credentials"));
    expect((await request(app).get("/orders")).body).toEqual({ error: "Error interno del servidor" });
  });
});
