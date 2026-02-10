import Bill from "../models/Bill.js";
import Milk from "../models/Milk.js";
import Deduction from "../models/Deduction.js";
import Bonus from "../models/Bonus.js";
import InventoryTransaction from "../models/InventoryTransaction.js";

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

        status: b.status ?? "Pending",
        createdAt: b.createdAt,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("getBills error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const generateBill = async (req, res) => {
  try {
    const { farmerId, periodFrom, periodTo } = req.body;
    // Force periodFrom to first of month

    const normalizedPeriodFrom = periodFrom.slice(0, 7) + "-01";

    const billMonth = normalizedPeriodFrom.slice(0, 7);
    // const milkList = await Milk.find({
    //   farmerId,
    //   date: { $gte: periodFrom, $lte: periodTo },
    // });

    const milkList = await Milk.find({
      farmerId,
      date: { $gte: normalizedPeriodFrom, $lte: periodTo },
    });

    const deductionList = await Deduction.find({
      farmerId,
      // date: { $gte: periodFrom, $lte: periodTo },
      date: { $gte: normalizedPeriodFrom, $lte: periodTo },
    });

    const bonusList = await Bonus.find({
      farmerId,
      // date: { $gte: periodFrom, $lte: periodTo },
      date: { $gte: normalizedPeriodFrom, $lte: periodTo },
    });
    // const inventoryList = await InventoryTransaction.find({
    //   farmerId,
    //   remainingAmount: { $gt: 0 },
    //   paymentMethod: { $ne: "Cash" },
    //   isAdjustedInBill: false,
    // });

    const inventoryList = await InventoryTransaction.find({
      farmerId,
      remainingAmount: { $gt: 0 },
      paymentMethod: { $ne: "Cash" },
      isAdjustedInBill: false,
      date: { $lte: new Date(periodTo) },
    });

    const totalLiters = milkList.reduce((s, m) => s + m.quantity, 0);
    const totalMilkAmount = milkList.reduce((s, m) => s + m.totalAmount, 0);
    // const totalDeduction = deductionList.reduce((s, d) => s + d.amount, 0);
    const totalBonus = bonusList.reduce((s, b) => s + b.amount, 0);

    const normalDeduction = deductionList.reduce((s, d) => s + d.amount, 0);

    const inventoryDeduction = inventoryList.reduce(
      (s, i) => s + i.remainingAmount,
      0,
    );

    const totalDeduction = normalDeduction + inventoryDeduction;

    const netPayable = totalMilkAmount + totalBonus - totalDeduction;

    await Bill.findOneAndDelete({
      farmerId,
      billMonth,
    });
    
    const bill = await Bill.create({
      farmerId,
      periodFrom: normalizedPeriodFrom,
      periodTo,
      billMonth: normalizedPeriodFrom.slice(0, 7),
      totalLiters,
      totalMilkAmount,
      totalDeduction,
      totalBonus,
      netPayable,
      status: "Pending",
    });

    await InventoryTransaction.updateMany(
      {
        farmerId,
        remainingAmount: { $gt: 0 },
        paymentMethod: { $ne: "Cash" },
        isAdjustedInBill: false,
      },
      { isAdjustedInBill: true },
    );

    res.json(bill);
  } catch (err) {
    // 🔒 Duplicate protection
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Bill already generated for this farmer and period",
      });
    }

    res.status(500).json({ message: err.message });
  }
};

export const previewBill = async (req, res) => {
  const { farmerId, periodFrom, periodTo } = req.body;

  //  normalize
  const normalizedPeriodFrom = periodFrom.slice(0, 7) + "-01";

  const milkList = await Milk.find({
    farmerId,
    date: { $gte: normalizedPeriodFrom, $lte: periodTo },
  });

  const deductionList = await Deduction.find({
    farmerId,
    date: { $gte: normalizedPeriodFrom, $lte: periodTo },
  });

  const bonusList = await Bonus.find({
    farmerId,
    date: { $gte: normalizedPeriodFrom, $lte: periodTo },
  });

  // const inventoryList = await InventoryTransaction.find({
  //   farmerId,
  //   remainingAmount: { $gt: 0 },
  //   paymentMethod: { $ne: "Cash" },
  //   isAdjustedInBill: false,
  // });

  const inventoryList = await InventoryTransaction.find({
    farmerId,
    remainingAmount: { $gt: 0 },
    paymentMethod: { $ne: "Cash" },
    $or: [
      { isAdjustedInBill: false },
      { isAdjustedInBill: { $exists: false } },
    ],
  });

  const totalLiters = milkList.reduce((s, m) => s + m.quantity, 0);
  const milkAmount = milkList.reduce((s, m) => s + m.totalAmount, 0);
  // const deductionAmount = deductionList.reduce((s, d) => s + d.amount, 0);
  const bonusAmount = bonusList.reduce((s, b) => s + b.amount, 0);

  const normalDeduction = deductionList.reduce((s, d) => s + d.amount, 0);

  const inventoryDeduction = inventoryList.reduce(
    (s, i) => s + i.remainingAmount,
    0,
  );

  const deductionAmount = normalDeduction + inventoryDeduction;

  res.json({
    totalLiters,
    milkAmount,
    deductionAmount,
    bonusAmount,
    netAmount: milkAmount + bonusAmount - deductionAmount,
  });
};

export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Do not allow deleting paid bills
    if (bill.status === "Paid") {
      return res.status(400).json({
        message: "Paid bills cannot be deleted",
      });
    }

    await bill.deleteOne();

    res.json({ message: "Bill deleted successfully" });
  } catch (err) {
    console.error("deleteBill error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const markBillAsPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const bill = await Bill.findById(id);

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.status === "Paid") {
      return res.status(400).json({ message: "Bill already marked as Paid" });
    }

    bill.status = "Paid";
    await bill.save();

    res.json({ message: "Bill marked as Paid" });
  } catch (err) {
    console.error("markBillAsPaid error:", err);
    res.status(500).json({ message: err.message });
  }
};
