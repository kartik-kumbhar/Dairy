import express from "express";
import { getMachineData } from "../controllers/machineController.js";

const router = express.Router();

router.get("/", getMachineData);

export default router;
