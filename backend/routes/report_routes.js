import express from "express";
import {
  dailyMilkReport,
  milkTypeReport,
  billingReport,
  inventoryReport,
  monthlyMilkReport,
} from "../controllers/report_controller.js";

const router = express.Router();

router.get("/daily-milk", dailyMilkReport);
router.get("/milk-type", milkTypeReport);
router.get("/billing", billingReport);
router.get("/inventory", inventoryReport);
router.get("/monthly-milk", monthlyMilkReport);


export default router;
