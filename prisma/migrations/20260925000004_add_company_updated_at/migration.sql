ALTER TABLE "companies" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "companies" SET "updatedAt" = "createdAt";
ALTER TABLE "companies" ALTER COLUMN "updatedAt" SET NOT NULL;
