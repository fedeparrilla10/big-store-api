import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type ProductInput = {
  sku: string;
  name: string;
  price: number;
  status?: "active" | "inactive";
};

export type UpdateProductInput = Partial<ProductInput>;

const toResponse = (product: {
  id: string;
  sku: string;
  name: string;
  status: string;
  price: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
}) => {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    status: product.status,
    price: product.price,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
};

export const createProduct = async (input: ProductInput) => {
  const product = await prisma.product.create({
    data: {
      sku: input.sku,
      name: input.name,
      price: input.price,
      ...(input.status !== undefined && { status: input.status }),
    },
  });
  return toResponse(product);
};

export const listProducts = async () => {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
  });
  return products.map(toResponse);
};

export const getProduct = async (id: string) => {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  return product ? toResponse(product) : null;
};

export const updateProduct = async (id: string, input: UpdateProductInput) => {
  const product = await prisma.product.update({
    where: { id, deletedAt: null },
    data: {
      sku: input.sku,
      name: input.name,
      status: input.status,
      price: input.price,
    },
  });
  return toResponse(product);
};

export const deleteProduct = async (id: string) => {
  const result = await prisma.product.updateMany({
    where: { id, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  return result.count > 0;
};
