import express from "express";
import { addFarmer, deleteFarmer, getFarmers } from "../controllers/farmer_controller.js";
import { protect } from "../middleware/auth_middleware.js";

const router = express.Router();

router.post("/",  addFarmer);
router.get("/",  getFarmers);
router.delete("/:id", deleteFarmer);
export default router;
