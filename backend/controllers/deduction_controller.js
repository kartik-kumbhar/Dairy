import Deduction from "../models/Deduction.js";
import Farmer from "../models/Farmer.js";
import Milk from "../models/Milk.js";

// export const addDeduction = async (req, res) => {
//   try {
//     const farmer = await Farmer.findById(req.body.farmerId);
//     if (!farmer) {
//       return res.status(400).json({ message: "Invalid farmer selected" });
//     }

//     const deduction = await Deduction.create({
//       farmerId: req.body.farmerId,
//       date: req.body.date,
//       type: req.body.category,
//       amount: req.body.amount,

//       remainingAmount: req.body.amount,
//       status: "Pending",

//       note: req.body.description || "",
//     });

//     res.status(201).json(deduction);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };
export const addDeduction = async (req, res) => {
  try {
    const { farmerId, date, category, amount, description } = req.body;

    if (!farmerId || !date || !category || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const deduction = await Deduction.create({
      farmerId,
      date,
      category,
      amount,
      remainingAmount: amount, // 🔥 IMPORTANT
      note: description || "",
      status: "Pending",
    });

    res.status(201).json(deduction);
  } catch (err) {
    console.error("Add deduction failed:", err);
    res.status(500).json({ message: "Failed to add deduction" });
  }
};

export const deleteDeduction = async (req, res) => {
  try {
    await Deduction.findByIdAndDelete(req.params.id);
    res.json({ message: "Deduction deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const adjustDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { remainingAmount, status } = req.body;

    const deduction = await Deduction.findByIdAndUpdate(
      id,
      { remainingAmount, status },
      { new: true },
    );

    if (!deduction) {
      return res.status(404).json({ message: "Deduction not found" });
    }

    res.json(deduction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const clearDeduction = async (req, res) => {
  try {
    const deduction = await Deduction.findById(req.params.id);
    if (!deduction) {
      return res.status(404).json({ message: "Deduction not found" });
    }

    deduction.remainingAmount = 0;
    deduction.status = "Cleared";

    await deduction.save();
    res.json(deduction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export const getDeductions = async (req, res) => {
  try {
    const deductions = await Deduction.find()
      .populate("farmerId", "name code");

    const formatted = await Promise.all(
      deductions.map(async (d) => {
        let remaining = d.remainingAmount;
        let status = d.status;

        // AUTO-DEDUCT MILK ONLY ONCE
        if (!d.autoAdjusted) {
          const milkAgg = await Milk.aggregate([
            {
              $match: {
                farmerId: d.farmerId._id,
                date: { $lte: d.date }, // STRING comparison OK (YYYY-MM-DD)
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$totalAmount" },
              },
            },
          ]);

          const milkAmount = milkAgg[0]?.total || 0;

          remaining = Math.max(d.amount - milkAmount, 0);
          status =
            remaining === 0
              ? "Cleared"
              : remaining < d.amount
              ? "Partial"
              : "Pending";

          await Deduction.findByIdAndUpdate(d._id, {
            remainingAmount: remaining,
            status,
            autoAdjusted: true,
          });
        }

        return {
          _id: d._id,
          date: d.date,
          category: d.type,
          amount: d.amount,
          remainingAmount: remaining,
          status,
          description: d.note,
          farmerName: d.farmerId.name,
          farmerCode: d.farmerId.code,
        };
      })
    );

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

