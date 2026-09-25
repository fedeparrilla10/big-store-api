ALTER TABLE "Product" RENAME TO "products";

ALTER TABLE "products" RENAME CONSTRAINT "Product_pkey" TO "products_pkey";
ALTER TABLE "products" RENAME CONSTRAINT "Product_status_check" TO "products_status_check";
ALTER TABLE "products" RENAME CONSTRAINT "Product_price_check" TO "products_price_check";
ALTER INDEX "Product_sku_key" RENAME TO "products_sku_key";
