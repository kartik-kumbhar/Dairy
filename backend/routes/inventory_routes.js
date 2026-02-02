import express from "express";
import {
  addInventory,
  getInventory,
  updateInventory,
  deleteInventory,
} from "../controllers/inventory_controller.js";

const router = express.Router();

router.post("/", addInventory);
router.get("/", getInventory);
router.put("/:id", updateInventory);
router.delete("/:id", deleteInventory);

export default router;
