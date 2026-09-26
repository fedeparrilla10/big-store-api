import { Router } from "express";
import * as controller from "./orders.controller";

export const ordersRouter = Router();

ordersRouter.post("/", controller.create);
ordersRouter.get("/", controller.list);
ordersRouter.get("/:id", controller.get);
ordersRouter.patch("/:id", controller.update);
ordersRouter.delete("/:id", controller.remove);
