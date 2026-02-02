import Milk from "../models/Milk.js";
import Farmer from "../models/Farmer.js";

export const addMilkEntry = async (req, res) => {
  try {
    const { farmerId, date, shift, quantity, fat, snf, rate } = req.body;

    if (
      !farmerId ||
      !date ||
      !shift ||
      quantity === undefined ||
      rate === undefined ||
      fat === undefined ||
      snf === undefined
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const farmer = await Farmer.findById(farmerId);

    if (!farmer) {
      return res.status(400).json({ message: "Invalid farmer" });
    }
    const totalAmount = Number(quantity) * Number(rate);

    const milk = await Milk.create({
      farmerId,
      date,
      shift,
      milkType: farmer.milkType.toLowerCase(),
      quantity,
      fat,
      snf,
      rate,
      totalAmount,
    });

    res.status(201).json(milk);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Milk entry already exists for this farmer, date and shift",
      });
    }

    console.error("Add milk failed:", err);
    res.status(500).json({ message: "Failed to save milk entry" });
  }
};

export const getMilkEntries = async (req, res) => {
  try {
    const { date, farmerId } = req.query;

    let filter = {};
    if (date) filter.date = date;
    if (farmerId) filter.farmerId = farmerId;

    const milkEntries = await Milk.find(filter)
      .populate("farmerId", "name code")
      .sort({ createdAt: -1 });

    const formatted = milkEntries
      .filter((m) => m.farmerId) //  avoid null populate
      .map((m) => ({
        _id: m._id,
        date: m.date,
        shift: m.shift,
        farmerId: m.farmerId._id,
        farmerName: m.farmerId.name,
        farmerCode: m.farmerId.code,
        milkType: m.milkType === "cow" ? "Cow" : "Buffalo",
        liters: m.quantity,
        fat: m.fat,
        snf: m.snf,
        rate: m.rate,
        amount: m.totalAmount,
      }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteMilkEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await Milk.findByIdAndDelete(id);
    res.json({ message: "Milk entry deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
