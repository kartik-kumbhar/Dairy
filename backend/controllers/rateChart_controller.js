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

// const defaultRateChart = (milkType) => {
//   const baseRate = milkType === "cow" ? 20 : 30;
//   const fatFactor = milkType === "cow" ? 4 : 5;
//   const snfFactor = 1;

//   return {
//     milkType,
//     fats: DEFAULT_FATS,
//     snfs: DEFAULT_SNFS,
//     rates: generateRates(baseRate, fatFactor, snfFactor),
//     baseRate,
//     fatFactor,
//     snfFactor,
//     effectiveFrom: new Date().toISOString().slice(0, 10),
//     updatedAt: new Date().toISOString(),
//   };
// };

const defaultRateChart = (milkType) => {
  const baseRate = milkType === "cow" ? 20 : 30;
  const fatFactor = milkType === "cow" ? 4 : 5;
  const snfFactor = 1;

  const fatMin = 3.0;
  const fatMax = 6.0;
  const fatStep = 0.5;

  const snfMin = 7.0;
  const snfMax = 9.5;
  const snfStep = 0.5;

  const fats = generateRange(fatMin, fatMax, fatStep);
  const snfs = generateRange(snfMin, snfMax, snfStep);

  return {
    milkType,
    fatMin,
    fatMax,
    fatStep,
    snfMin,
    snfMax,
    snfStep,
    fats,
    snfs,
    rates: generateRatesFromRange(baseRate, fatFactor, snfFactor, fats, snfs),
    baseRate,
    fatFactor,
    snfFactor,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString(),
  };
};

const generateRange = (min, max, step) => {
  const arr = [];
  for (let v = min; v <= max; v += step) {
    arr.push(+v.toFixed(2));
  }
  return arr;
};

const generateRatesFromRange = (baseRate, fatFactor, snfFactor, fats, snfs) => {
  return fats.map((fat) =>
    snfs.map(
      (snf) => +(baseRate + fat * fatFactor + snf * snfFactor).toFixed(2),
    ),
  );
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

    // ✅ REMOVE _id BEFORE SAVING HISTORY
    const { _id, ...historyData } = req.body;

    await RateChartHistory.create({
      ...historyData,
      milkType,
      effectiveFrom,
      savedBy: req.user?._id || null,
      createdAt: new Date(),
    });

    const updated = await RateChart.findOneAndUpdate(
      { milkType, effectiveFrom },
      {
        ...historyData,
        milkType,
        effectiveFrom,
        updatedAt: new Date().toISOString(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.json(updated);
  } catch (err) {
    console.error("Rate chart update failed:", err);
    res.status(500).json({ message: err.message });
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
