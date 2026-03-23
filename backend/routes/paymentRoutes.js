import express from "express";
import { payAllBills, payBill, razorpayWebhook } from "../controllers/paymentController.js";
const router = express.Router();

router.post("/pay-bill", payBill);
router.post("/webhook/razorpay", razorpayWebhook);
router.post("/pay-all", payAllBills);


export default router;
