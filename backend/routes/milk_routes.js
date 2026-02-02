import express from "express";
import { protect } from "../middleware/auth_middleware.js";
import { addMilkEntry, getMilkEntries, deleteMilkEntry } from "../controllers/milk_controller.js";

const router = express.Router();

router.post("/",  addMilkEntry);
router.get("/",  getMilkEntries);
router.delete("/:id",  deleteMilkEntry);

export default router;
