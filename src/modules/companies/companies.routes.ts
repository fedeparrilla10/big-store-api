import { Router } from "express";
import * as controller from "./companies.controller";

export const companiesRouter = Router();

companiesRouter.post("/", controller.create);
companiesRouter.get("/", controller.list);
companiesRouter.get("/:id", controller.get);
companiesRouter.patch("/:id", controller.update);
companiesRouter.delete("/:id", controller.remove);
