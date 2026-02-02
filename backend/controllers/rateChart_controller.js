import RateChart from "../models/RateChart.js";
import RateChartHistory from "../models/RateChartHistory.js";

const DEFAULT_FATS = [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0];
const DEFAULT_SNFS = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5];

const generateRates = (baseRate, fatFactor, snfFactor) => {
  return DEFAULT_FATS.map((fat) =>
    DEFAULT_SNFS.map(
      (snf) => +(baseRate + fat * fatFactor + snf * snfFactor).toFixed(2),
    ),
  );
};

const defaultRateChart = (milkType) => {
  const baseRate = milkType === "cow" ? 20 : 30;
  const fatFactor = milkType === "cow" ? 4 : 5;
  const snfFactor = 1;

  return {
    milkType,
    fats: DEFAULT_FATS,
    snfs: DEFAULT_SNFS,
    rates: generateRates(baseRate, fatFactor, snfFactor),
    baseRate,
    fatFactor,
    snfFactor,
    updatedAt: new Date().toISOString(),
  };
};

/**
 * GET /rate-chart
 * Fetch Cow + Buffalo rate charts
 */
export const getRateCharts = async (req, res) => {
  try {
    let cow = await RateChart.findOne({ milkType: "cow" }).sort({
      effectiveFrom: -1,
    });

    let buffalo = await RateChart.findOne({ milkType: "buffalo" }).sort({
      effectiveFrom: -1,
    });

    if (!cow) {
      cow = await RateChart.create(defaultRateChart("cow"));
    }

    if (!buffalo) {
      buffalo = await RateChart.create(defaultRateChart("buffalo"));
    }

    res.json({ cow, buffalo });
  } catch (err) {
    console.error("RateChart error:", err);
    res.status(500).json({ message: "Failed to fetch rate charts" });
  }
};

/**
 * PUT /rate-chart/:milkType
 * Update Cow or Buffalo chart
 */

export const updateRateChart = async (req, res) => {
  try {
    const { milkType } = req.params;

    if (!["cow", "buffalo"].includes(milkType)) {
      return res.status(400).json({ message: "Invalid milk type" });
    }

    const effectiveFrom =
      req.body.effectiveFrom || new Date().toISOString().slice(0, 10);

    // Save history
    await RateChartHistory.create({
      ...req.body,
      milkType,
      effectiveFrom,
      savedBy: req.user?._id || null,
    });

    // Upsert current active chart
    // const updated = await RateChart.findOneAndUpdate(
    //   { milkType },
    //   {
    //     ...req.body,
    //     milkType,
    //     effectiveFrom,
    //     updatedAt: new Date().toISOString(),
    //   },
    //   { new: true, upsert: true },
    // );
    const updated = await RateChart.findOneAndUpdate(
      { milkType, effectiveFrom: req.body.effectiveFrom },
      {
        ...req.body,
        milkType,
        updatedAt: new Date().toISOString(),
      },
      { new: true, upsert: true },
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update rate chart" });
  }
};

export const getRateForMilk = async (req, res) => {
  try {
    const { milkType, fat, snf, date } = req.query;

    if (!milkType || !fat || !snf || !date) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const chart = await RateChart.findOne({
      milkType,
      effectiveFrom: { $lte: date },
    }).sort({ effectiveFrom: -1 });

    if (!chart) {
      return res.status(404).json({ message: "Rate chart not found" });
    }

    const fatIndex = chart.fats.indexOf(Number(fat));
    const snfIndex = chart.snfs.indexOf(Number(snf));

    if (fatIndex === -1 || snfIndex === -1) {
      return res.status(404).json({ message: "Rate not defined for FAT/SNF" });
    }

    res.json({
      rate: chart.rates[fatIndex][snfIndex],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
