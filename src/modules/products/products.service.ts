import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type ProductInput = {
  sku: string;
  name: string;
  price: number;
  status?: "active" | "inactive";
};

function toResponse(product: {
  id: string;
  sku: string;
  name: string;
  status: string;
  priceCents: bigint;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    status: product.status,
    price: Number(product.priceCents) / 100,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function createProduct(input: ProductInput) {
  const product = await prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      priceCents: BigInt(Math.round(input.price * 100)),
      ...(input.status !== undefined && { status: input.status }),
    },
  });
  return toResponse(product);
}

export async function listProducts() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
  });
  return products.map(toResponse);
}

export async function getProduct(id: string) {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  return product ? toResponse(product) : null;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const product = await prisma.product.update({
    where: { id, deletedAt: null },
    data: {
      sku: input.sku,
      name: input.name,
      status: input.status,
      priceCents:
        input.price === undefined
          ? undefined
          : BigInt(Math.round(input.price * 100)),
    },
  });
  return toResponse(product);
}

export async function deleteProduct(id: string) {
  const result = await prisma.product.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
}
