import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type CompanyInput = {
  name: string;
};

export const createCompany = async (input: CompanyInput) => {
  return prisma.company.create({ data: { name: input.name } });
};

export const listCompanies = async () => {
  return prisma.company.findMany();
};

export const getCompany = async (id: string) => {
  return prisma.company.findUnique({ where: { id } });
};

export const updateCompany = async (id: string, input: CompanyInput) => {
  return prisma.company.update({ where: { id }, data: { name: input.name } });
};

export const deleteCompany = async (id: string) => {
  return prisma.company.delete({ where: { id } });
};
