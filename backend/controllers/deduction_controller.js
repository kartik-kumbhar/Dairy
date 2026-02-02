import Deduction from "../models/Deduction.js";
import Farmer from "../models/Farmer.js";

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
//       note: req.body.description || "",
//     });

//     res.status(201).json(deduction);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

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
    const farmer = await Farmer.findById(req.body.farmerId);
    if (!farmer) {
      return res.status(400).json({ message: "Invalid farmer selected" });
    }

    const deduction = await Deduction.create({
      farmerId: req.body.farmerId,
      date: req.body.date,
      type: req.body.category,
      amount: req.body.amount,

      // ✅ INITIAL VALUES
      remainingAmount: req.body.amount,
      status: "Pending",

      note: req.body.description || "",
    });

    res.status(201).json(deduction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// export const getDeductions = async (req, res) => {
//   try {
//     const deductions = await Deduction.find()
//       .populate("farmerId", "name code")
//       .sort({ createdAt: -1 });

//     const formatted = deductions
//       .filter((d) => d.farmerId)
//       .map((d) => ({
//         _id: d._id,
//         date: d.date,
//         category: d.type,
//         amount: d.amount,

//         // 🔥 USE DB VALUES
//         remainingAmount: d.remainingAmount,
//         status: d.status,

//         description: d.note,
//         farmerName: d.farmerId.name,
//         farmerCode: d.farmerId.code,
//       }));

//     res.json(formatted);
//   } catch (err) {
//     console.error("Get deductions failed:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

export const getDeductions = async (req, res) => {
  try {
    const deductions = await Deduction.find()
      .populate("farmerId", "name code")
      .sort({ createdAt: -1 });

    const formatted = deductions
      .filter((d) => d.farmerId)
      .map((d) => ({
        _id: d._id,
        date: d.date,
        category: d.type,
        amount: d.amount,

        // ✅ READ FROM DB
        remainingAmount: d.remainingAmount,
        status: d.status,

        description: d.note,
        farmerName: d.farmerId.name,
        farmerCode: d.farmerId.code,
      }));

    res.json(formatted);
  } catch (err) {
    console.error("Get deductions failed:", err);
    res.status(500).json({ message: err.message });
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
