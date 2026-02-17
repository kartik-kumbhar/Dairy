import Milk from "../models/Milk.js";

/* ================= TODAY ================= */
export const getTodayDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const collections = await Milk.find({ date: today });

    let totalLiters = 0;
    let cowLiters = 0;
    let buffaloLiters = 0;
    let mixLiters = 0;
    let amountToday = 0;

    const farmerSet = new Set();

    collections.forEach((c) => {
      totalLiters += c.quantity;
      amountToday += c.totalAmount;
      farmerSet.add(c.farmerId.toString());

      if (c.milkType === "cow") cowLiters += c.quantity;
      if (c.milkType === "buffalo") buffaloLiters += c.quantity;
      if (c.milkType === "mix") mixLiters += c.quantity;
    });

    res.json({
      totalLiters,
      cowLiters,
      buffaloLiters,
      mixLiters,
      farmersToday: farmerSet.size,
      amountToday,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= MONTH ================= */
export const getMonthlyDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    const collections = await Milk.find({ date: { $gte: start } });

    let totalLiters = 0;
    let cowLiters = 0;
    let buffaloLiters = 0;
    let mixLiters = 0;

    let amount = 0;

    collections.forEach((c) => {
      totalLiters += c.quantity;
      amount += c.totalAmount;

      if (c.milkType === "cow") cowLiters += c.quantity;
      if (c.milkType === "buffalo") buffaloLiters += c.quantity;
      if (c.milkType === "mix") mixLiters += c.quantity;
    });

    res.json({
      totalLiters,
      amount,
      cowPercent: totalLiters ? Math.round((cowLiters / totalLiters) * 100) : 0,
      buffaloPercent: totalLiters
        ? Math.round((buffaloLiters / totalLiters) * 100)
        : 0,
      mixPercent: totalLiters ? Math.round((mixLiters / totalLiters) * 100) : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= TOP FARMERS ================= */
export const getTopFarmers = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);

    const result = await Milk.aggregate([
      { $match: { date: { $gte: start } } },
      {
        $group: {
          _id: "$farmerId",
          liters: { $sum: "$quantity" }, // ✅ FIX
          amount: { $sum: "$totalAmount" }, // ✅ FIX
        },
      },
      { $sort: { liters: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "farmers",
          localField: "_id",
          foreignField: "_id",
          as: "farmer",
        },
      },
      { $unwind: "$farmer" },
      {
        $project: {
          _id: 0,
          code: "$farmer.code",
          name: "$farmer.name",
          liters: 1,
          amount: 1,
        },
      },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
