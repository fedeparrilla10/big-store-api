ALTER TABLE "orders" ADD COLUMN "updatedAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN "deletedAt" TIMESTAMP(3);
UPDATE "orders" SET "updatedAt" = "createdAt";
ALTER TABLE "orders" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "order_items" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "order_items" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "order_items" SET "createdAt" = "orders"."createdAt", "updatedAt" = "orders"."createdAt"
FROM "orders" WHERE "order_items"."orderId" = "orders"."id";
ALTER TABLE "order_items" ALTER COLUMN "updatedAt" SET NOT NULL;
