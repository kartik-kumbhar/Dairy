import express from "express";
import {
  dailyMilkReport,
  milkTypeReport,
  inventoryReport,
  monthlyMilkReport,
  getMonthlyBillingReport,
} from "../controllers/report_controller.js";

const router = express.Router();

router.get("/daily-milk", dailyMilkReport);
router.get("/milk-type", milkTypeReport);
router.get("/inventory", inventoryReport);
router.get("/monthly-milk", monthlyMilkReport);
router.get("/billing", getMonthlyBillingReport);


export default router;
