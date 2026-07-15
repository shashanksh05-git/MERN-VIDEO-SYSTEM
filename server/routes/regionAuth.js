import express from "express";
import {
  requestRegionOtp,
  verifyRegionOtp,
} from "../controllers/regionAuth.js";

const routes = express.Router();

routes.post("/request-otp", requestRegionOtp);
routes.post("/verify-otp", verifyRegionOtp);

export default routes;