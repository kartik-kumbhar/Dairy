import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/db.js";
import router from "./routes/auth_routes.js";
import farmerRoutes from "./routes/farmer_routes.js";
import milkRoutes from "./routes/milk_routes.js";
import deductionRoutes from "./routes/deduction_routes.js";
import inventoryRoutes from "./routes/inventory_routes.js";
import bonusRoutes from "./routes/bonus_routes.js";
import billRoutes from "./routes/bill_routes.js";
import dashboardRoutes from "./routes/dashboard_routes.js";
import rateChartRoutes from "./routes/rateChart_routes.js"

dotenv.config({debug:false});
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "https://dairy-eo1r.vercel.app/",
    credentials: true,
  }),
);

connectDB();

app.get("/", (req, res) => {
  res.send("Dairy Backend Running");
});

app.use("/api/auth", router);
app.use("/api/farmers", farmerRoutes);
app.use("/api/milk", milkRoutes)
app.use("/api/deductions", deductionRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/bonus", bonusRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rate-chart", rateChartRoutes);


const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
