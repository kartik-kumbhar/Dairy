import Milk from "../models/Milk.js";
import Bill from "../models/Bill.js";
import Inventory from "../models/Inventory.js";

/**
 * Milk Collection Report
 * Daily or Monthly
 */
export const milkCollectionReport = async (req, res) => {
  try {
    const { date, month } = req.query;

    const filter = {};
    if (date) filter.date = date;
    if (month) filter.date = { $regex: `^${month}` };

    const entries = await Milk.find(filter)
      .populate("farmerId", "name code milkType")
      .sort({ date: 1 });

    let totalLiters = 0;
    let totalAmount = 0;

    entries.forEach((e) => {
      totalLiters += e.quantity;
      totalAmount += e.totalAmount;
    });

    res.json({
      totalLiters,
      totalAmount,
      entries,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Cow / Buffalo Milk Yield Report
 */
export const milkTypeReport = async (req, res) => {
  try {
    const data = await Milk.aggregate([
      {
        $group: {
          _id: "$milkType",
          totalLiters: { $sum: "$quantity" },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Billing Report
 */
export const billingReport = async (req, res) => {
  try {
    const { month } = req.query;
    const filter = month ? { month } : {};

    const bills = await Bill.find(filter).populate("farmerId", "name code");

    let totalPayable = 0;
    let paid = 0;
    let pending = 0;

    bills.forEach((b) => {
      totalPayable += b.netPayable;
      if (b.status === "Paid") paid += b.netPayable;
      else pending += b.netPayable;
    });

    res.json({
      totalPayable,
      paid,
      pending,
      bills,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * Inventory Report
 */
export const inventoryReport = async (req, res) => {
  try {
    const items = await Inventory.find();

    const lowStockItems = items.filter((i) => i.quantity < 5);

    res.json({
      totalItems: items.length,
      lowStockCount: lowStockItems.length,
      items,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
