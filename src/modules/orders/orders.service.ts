import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type OrderInput = {
  companyId: string;
  items: { productId: string; quantity: number }[];
};

export type OrderStatus = "pending" | "confirmed" | "cancelled";

const toResponse = (
  order: Prisma.OrderGetPayload<{ include: { items: true } }>,
) => ({
  id: order.id,
  companyId: order.companyId,
  status: order.status,
  total: order.total,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
  items: order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    sku: item.sku,
    productName: item.productName,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  })),
});

export const createOrder = async (input: OrderInput) => {
  return prisma.$transaction(async (tx) => {
    const company = await tx.company.findUnique({
      where: { id: input.companyId },
    });

    if (!company) return { reason: "company-not-found" as const };

    const products = await tx.product.findMany({
      where: {
        id: { in: input.items.map((item) => item.productId) },
        status: "active",
        deletedAt: null,
      },
    });

    if (products.length !== input.items.length) {
      return { reason: "products-unavailable" as const };
    }

    const items = input.items.map(({ productId, quantity }) => {
      const product = products.find((product) => product.id === productId)!;
      return {
        productId,
        quantity,
        sku: product.sku,
        productName: product.name,
        unitPrice: product.price,
      };
    });

    const total = items.reduce(
      (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    const order = await tx.order.create({
      data: {
        companyId: input.companyId,
        total,
        items: { create: items },
      },
      include: { items: true },
    });
    return { order: toResponse(order) };
  });
};

export const listOrders = async () => {
  const orders = await prisma.order.findMany({
    where: { deletedAt: null },
    include: { items: true },
  });
  return orders.map(toResponse);
};

export const getOrder = async (id: string) => {
  const order = await prisma.order.findFirst({
    where: { id, deletedAt: null },
    include: { items: true },
  });
  return order ? toResponse(order) : null;
};

export const updateOrder = async (id: string, status: OrderStatus) => {
  const order = await prisma.order.update({
    where: { id, deletedAt: null },
    data: { status },
    include: { items: true },
  });
  return toResponse(order);
};

export const deleteOrder = async (id: string) => {
  const result = await prisma.order.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
};
