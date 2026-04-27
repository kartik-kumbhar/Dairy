import mongoose from "mongoose";

const bonusSchema = new mongoose.Schema(
  {
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Bonus", bonusSchema);
