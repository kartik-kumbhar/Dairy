import express from "express";
import {
  milkCollectionReport,
  milkTypeReport,
  billingReport,
  inventoryReport,
} from "../controllers/report_controller.js";

const router = express.Router();

router.get("/milk", milkCollectionReport);
router.get("/milk-type", milkTypeReport);
router.get("/billing", billingReport);
router.get("/inventory", inventoryReport);

export default router;
