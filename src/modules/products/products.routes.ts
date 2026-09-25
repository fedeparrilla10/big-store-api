import { Router } from "express";
import * as controller from "./products.controller";

export const productsRouter = Router();

productsRouter.post("/", controller.create);
productsRouter.get("/", controller.list);
productsRouter.get("/:id", controller.get);
productsRouter.patch("/:id", controller.update);
productsRouter.delete("/:id", controller.remove);
