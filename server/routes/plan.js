import express from "express";

import {
  getPlans,
  createPlanOrder,
  verifyPlanPayment,
  activateDemoPlan,
} from "../controllers/plan.js";

const routes = express.Router();

routes.get("/", getPlans);
routes.post("/create-order", createPlanOrder);
routes.post("/verify-payment", verifyPlanPayment);
routes.post("/demo", activateDemoPlan);

export default routes;