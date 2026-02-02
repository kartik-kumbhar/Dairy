import express from "express";
import {
  getRateCharts,
  getRateForMilk,
  updateRateChart,
} from "../controllers/rateChart_controller.js";
import { protect } from "../middleware/auth_middleware.js";

const router = express.Router();

router.get("/", getRateCharts);
router.get("/rate", getRateForMilk);
router.put("/:milkType", updateRateChart);
// router.put("/:milkType", protect, adminOnly, updateRateChart);

export default router;
