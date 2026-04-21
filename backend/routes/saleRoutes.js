import express from "express";
import { addSale, getSales } from "../controllers/saleController.js";

const router = express.Router();

router.post("/add", addSale);
router.get("/", getSales);

export default router;
