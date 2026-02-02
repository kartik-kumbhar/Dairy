import Bill from "../models/Bill.js";
import Milk from "../models/Milk.js";
import Deduction from "../models/Deduction.js";
import Bonus from "../models/Bonus.js";

export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate("farmerId", "name code")
      .sort({ createdAt: -1 });

    const formatted = bills.map((b, index) => {
      const farmer = b.farmerId; // may be null

      return {
        _id: b._id,
        billNo: `BILL-${String(index + 1).padStart(4, "0")}`,

        farmerId: farmer?._id ?? null,
        farmerName: farmer?.name ?? "Deleted Farmer",
        farmerCode: farmer?.code ?? "-",
        periodFrom: b.periodFrom,
        periodTo: b.periodTo,

        totalLiters: b.totalLiters ?? 0,
        milkAmount: b.totalMilkAmount ?? 0,
        bonusAmount: b.totalBonus ?? 0,
        deductionAmount: b.totalDeduction ?? 0,
        netAmount: b.netPayable ?? 0,

        status: "Pending",
        createdAt: b.createdAt,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("getBills error:", err);
    res.status(500).json({ message: err.message });
  }
};

// export const generateBill = async (req, res) => {
//   try {
//     const { farmerId, periodFrom, periodTo } = req.body;

//     const milkList = await Milk.find({
//       farmerId,
//       date: { $gte: periodFrom, $lte: periodTo }, // string vs string ✔
//     });

//     const deductionList = await Deduction.find({
//       farmerId,
//       date: { $gte: periodFrom, $lte: periodTo },
//     });

//     const bonusList = await Bonus.find({
//       farmerId,
//       date: { $gte: periodFrom, $lte: periodTo },
//     });

//     const totalLiters = milkList.reduce((s, m) => s + m.quantity, 0);
//     const totalMilkAmount = milkList.reduce((s, m) => s + m.totalAmount, 0);
//     const totalDeduction = deductionList.reduce((s, d) => s + d.amount, 0);
//     const totalBonus = bonusList.reduce((s, b) => s + b.amount, 0);

//     const netPayable = totalMilkAmount + totalBonus - totalDeduction;

//     const bill = await Bill.findOneAndUpdate(
//       { farmerId, periodFrom, periodTo },
//       {
//         farmerId,
//         periodFrom,
//         periodTo,
//         totalLiters,
//         totalMilkAmount,
//         totalDeduction,
//         totalBonus,
//         netPayable,
//       },
//       { new: true, upsert: true },
//     );

//     res.json(bill);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
export const generateBill = async (req, res) => {
  try {
    const { farmerId, periodFrom, periodTo } = req.body;

    if (!farmerId || !periodFrom || !periodTo) {
      return res.status(400).json({
        message: "farmerId, periodFrom and periodTo are required",
      });
    }

    const milkList = await Milk.find({
      farmerId,
      date: { $gte: periodFrom, $lte: periodTo },
    });

    const deductionList = await Deduction.find({
      farmerId, 
      date: { $gte: periodFrom, $lte: periodTo },
    });

    const bonusList = await Bonus.find({
      farmerId,   
      date: { $gte: periodFrom, $lte: periodTo },
    });

    const totalLiters = milkList.reduce((s, m) => s + m.quantity, 0);
    const totalMilkAmount = milkList.reduce((s, m) => s + m.totalAmount, 0);
    const totalDeduction = deductionList.reduce((s, d) => s + d.amount, 0);
    const totalBonus = bonusList.reduce((s, b) => s + b.amount, 0);

    const netPayable = totalMilkAmount + totalBonus - totalDeduction;

    const bill = await Bill.findOneAndUpdate(
      { farmerId, periodFrom, periodTo },
      {
        farmerId,
        periodFrom,
        periodTo,
        totalLiters,
        totalMilkAmount,
        totalDeduction,
        totalBonus,
        netPayable,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.json(bill);
  } catch (err) {
    console.error("generateBill error:", err);

    // Handle duplicate key explicitly
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Bill already exists for this farmer and period",
      });
    } 

    res.status(500).json({ message: err.message });
  }
};

export const previewBill = async (req, res) => {
  const { farmerId, periodFrom, periodTo } = req.body;

  const milkList = await Milk.find({
    farmerId,
    date: { $gte: periodFrom, $lte: periodTo },
  });

  const deductionList = await Deduction.find({
    farmerId,
    date: { $gte: periodFrom, $lte: periodTo },
  });

  const bonusList = await Bonus.find({
    farmerId,
    date: { $gte: periodFrom, $lte: periodTo },
  });

  const totalLiters = milkList.reduce((s, m) => s + m.quantity, 0);
  const milkAmount = milkList.reduce((s, m) => s + m.totalAmount, 0);
  const deductionAmount = deductionList.reduce((s, d) => s + d.amount, 0);
  const bonusAmount = bonusList.reduce((s, b) => s + b.amount, 0);

  res.json({
    totalLiters,
    milkAmount,
    deductionAmount,
    bonusAmount,
    netAmount: milkAmount + bonusAmount - deductionAmount,
  });
};
