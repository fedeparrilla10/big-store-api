ALTER TABLE "products" DROP CONSTRAINT "products_price_check";
ALTER TABLE "orders" DROP CONSTRAINT "orders_total_check";
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_unit_price_check";

ALTER TABLE "products" RENAME COLUMN "priceCents" TO "price";
ALTER TABLE "orders" RENAME COLUMN "totalCents" TO "total";
ALTER TABLE "order_items" RENAME COLUMN "unitPriceCents" TO "unitPrice";

ALTER TABLE "products" ALTER COLUMN "price" TYPE DECIMAL(16, 2) USING ("price"::DECIMAL / 100);
ALTER TABLE "orders" ALTER COLUMN "total" TYPE DECIMAL(30, 2) USING ("total"::DECIMAL / 100);
ALTER TABLE "order_items" ALTER COLUMN "unitPrice" TYPE DECIMAL(16, 2) USING ("unitPrice"::DECIMAL / 100);

ALTER TABLE "products" ADD CONSTRAINT "products_price_check" CHECK ("price" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_check" CHECK ("total" >= 0);
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unit_price_check" CHECK ("unitPrice" >= 0);
