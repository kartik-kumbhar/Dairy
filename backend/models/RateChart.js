import mongoose from "mongoose";

const rateChartSchema = new mongoose.Schema(
  {
    milkType: {
      type: String,
      enum: ["cow", "buffalo"],
      required: true,
      unique: true,
    },
    fats: {
      type: [Number],
      required: true,
    },
    snfs: {
      type: [Number],
      required: true,
    },
    rates: {
      type: [[Number]],
      required: true,
    },
    baseRate: {
      type: Number,
      required: true,
    },
    fatFactor: {
      type: Number,
      required: true,
    },
    snfFactor: {
      type: Number,
      required: true,
    },
    updatedAt: {
      type: String,
    },
    effectiveFrom: {
      type: String, // YYYY-MM-DD
      required: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("RateChart", rateChartSchema);
