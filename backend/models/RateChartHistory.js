import mongoose from "mongoose";

const rateChartHistorySchema = new mongoose.Schema({
  milkType: String,
  fats: [Number],
  snfs: [Number],
  rates: [[Number]],
  baseRate: Number,
  fatFactor: Number,
  snfFactor: Number,
  effectiveFrom: String,
  savedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("RateChartHistory", rateChartHistorySchema);
