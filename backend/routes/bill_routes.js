import express from "express";
import { protect } from "../middleware/auth_middleware.js";
import {
  generateBill,
  getBills,
  previewBill,
} from "../controllers/bill_controller.js";

const router = express.Router();

router.post("/generate", generateBill);
router.get("/", getBills);
router.post("/preview", previewBill);

export default router;
