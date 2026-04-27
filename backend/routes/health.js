import express from "express";
const healthRoutes = express.Router();

healthRoutes.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

export default healthRoutes;
