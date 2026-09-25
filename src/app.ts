import express from "express";
import { companiesRouter } from "./modules/companies/companies.routes";
import { productsRouter } from "./modules/products/products.routes";

export const app = express();

app.use(express.json());
app.use("/companies", companiesRouter);
app.use("/products", productsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});
