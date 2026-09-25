CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "priceCents" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Product_status_check" CHECK ("status" IN ('active', 'inactive')),
    CONSTRAINT "Product_price_check" CHECK ("priceCents" BETWEEN 0 AND 9007199254740991)
);

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
