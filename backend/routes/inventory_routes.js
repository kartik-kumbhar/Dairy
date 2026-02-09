import express from "express";
import {
  addInventory,
  getInventory,
  updateInventory,
  deleteInventory,
  getInventoryReport,
} from "../controllers/inventory_controller.js";

const router = express.Router();

router.post("/", addInventory);
router.get("/", getInventory);
router.put("/:id", updateInventory);
router.delete("/:id", deleteInventory);
router.get("/report", getInventoryReport);

export default router;
