import express from "express";
import {
  createPremiumOrder,
  verifyPremiumPayment,
  activateDemoPremium,
} from "../controllers/payment.js";

const routes = express.Router();

routes.post("/create-premium-order", createPremiumOrder);
routes.post("/verify-premium-payment", verifyPremiumPayment);
routes.post("/demo-premium", activateDemoPremium);

export default routes;