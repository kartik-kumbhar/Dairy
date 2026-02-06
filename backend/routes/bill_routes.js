import express from "express";
import { protect } from "../middleware/auth_middleware.js";
import {
  deleteBill,
  generateBill,
  getBills,
  markBillAsPaid,
  previewBill,
} from "../controllers/bill_controller.js";

const router = express.Router();

router.post("/generate", generateBill);
router.get("/", getBills);
router.post("/preview", previewBill);
router.delete("/:id", deleteBill); 
router.put("/:id/pay", markBillAsPaid); 

export default router;
