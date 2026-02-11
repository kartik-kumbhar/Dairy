// src/pages/rateChart/rateChart.tsx
import React, { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

import InputField from "../../components/inputField";
import StatCard from "../../components/statCard";
import ConfirmModal from "../../components/confirmModal";

import type { MilkType } from "../../types/farmer";
import type { MilkRateChart } from "../../types/rateChart";
import { getRateCharts, updateRateChart } from "../../axios/rateChart_api";
import toast from "react-hot-toast";

type RateChartExcelRow = {
  FAT?: number;
  fat?: number;
  Fat?: number;
  SNF?: number;
  snf?: number;
  Snf?: number;
  Rate?: number;
  rate?: number;
  RATE?: number;
};

type RateChartStorage = {
  cow: MilkRateChart;
  buffalo: MilkRateChart;
};

// Default FAT and SNF steps used to build the matrix
const DEFAULT_FATS = [3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0];
const DEFAULT_SNFS = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5];

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formulaRate(
  baseRate: number,
  fatFactor: number,
  snfFactor: number,
  fat: number,
  snf: number,
): number {
  return round2(baseRate + fat * fatFactor + snf * snfFactor);
}

function generateMatrix(
  chart: Pick<
    MilkRateChart,
    "fats" | "snfs" | "baseRate" | "fatFactor" | "snfFactor"
  >,
): number[][] {
  return chart.fats.map((fat) =>
    chart.snfs.map((snf) =>
      formulaRate(chart.baseRate, chart.fatFactor, chart.snfFactor, fat, snf),
    ),
  );
}

function defaultChart(milkType: MilkType): MilkRateChart {
  const now = new Date().toISOString();
  const today = now.slice(0, 10); // YYYY-MM-DD

  const baseRate = milkType === "cow" ? 20 : 30;
  const fatFactor = milkType === "cow" ? 4 : 5;
  const snfFactor = 1;

  const baseConfig = {
    milkType,
    fats: DEFAULT_FATS,
    snfs: DEFAULT_SNFS,
    baseRate,
    fatFactor,
    snfFactor,
  };

  return {
    ...baseConfig,
    rates: generateMatrix(baseConfig),
    effectiveFrom: today, // ✅ REQUIRED
    updatedAt: now,
  };
}

const RateChartPage: React.FC = () => {
  const [charts, setCharts] = useState<RateChartStorage | null>(null);
  const [activeMilkType, setActiveMilkType] = useState<MilkType>("cow");
  const [saving, setSaving] = useState(false);

  // Confirm reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Hidden file input for Excel import
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRateCharts();

        const cowChart = res.data.cow
          ? {
              ...res.data.cow,
              effectiveFrom:
                res.data.cow.effectiveFrom ??
                new Date().toISOString().slice(0, 10),
            }
          : defaultChart("cow");

        const buffaloChart = res.data.buffalo
          ? {
              ...res.data.buffalo,
              effectiveFrom:
                res.data.buffalo.effectiveFrom ??
                new Date().toISOString().slice(0, 10),
            }
          : defaultChart("buffalo");

        setCharts({
          cow: cowChart,
          buffalo: buffaloChart,
        });
      } catch (err) {
        console.error("Failed to load rate charts:", err);
        toast.error("Failed to load rate charts");
      }
    };

    load();
  }, []);

  if (!charts) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#F8F4E3]">
        <span className="text-sm text-[#5E503F]/70">Loading rate chart...</span>
      </div>
    );
  }

  const current: MilkRateChart =
    activeMilkType === "cow" ? charts.cow : charts.buffalo;

  const setCurrent = (updated: MilkRateChart) => {
    const copy: RateChartStorage = { ...charts };
    if (updated.milkType === "cow") {
      copy.cow = updated;
    } else {
      copy.buffalo = updated;
    }
    setCharts(copy);
  };

  const handleFormulaChange = (
    field: "baseRate" | "fatFactor" | "snfFactor",
    value: string,
  ) => {
    const num = parseFloat(value);
    const safe = Number.isNaN(num) ? 0 : num;
    setCurrent({
      ...current,
      [field]: safe,
    });
  };

  const regenerateFromFormula = () => {
    const baseConfig = {
      fats: current.fats,
      snfs: current.snfs,
      baseRate: current.baseRate,
      fatFactor: current.fatFactor,
      snfFactor: current.snfFactor,
    };
    const matrix = generateMatrix(baseConfig);
    setCurrent({
      ...current,
      rates: matrix,
      effectiveFrom: current.effectiveFrom,
      updatedAt: new Date().toISOString(),
    });
  };

  const resetToDefault = () => {
    const def = defaultChart(activeMilkType);
    setCurrent(def);
    setShowResetConfirm(false);
    toast.success(`${activeMilkType} rate chart reset to default`);
  };

  const handleCellChange = (
    fatIndex: number,
    snfIndex: number,
    value: string,
  ) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return;
    const newRates = current.rates.map((row, rIdx) =>
      row.map((cell, cIdx) =>
        rIdx === fatIndex && cIdx === snfIndex ? num : cell,
      ),
    );
    setCurrent({
      ...current,
      rates: newRates,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const chartToSave =
        activeMilkType === "cow" ? charts.cow : charts.buffalo;

      await updateRateChart(activeMilkType, {
        ...chartToSave,
        effectiveFrom:
          chartToSave.effectiveFrom || new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      });

      toast.success("Rate chart saved successfully");
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save rate chart");
    } finally {
      setSaving(false);
    }
  };

  // Compute stats (no hooks, just plain logic)
  const flatRates = current.rates.flat();
  const stats = flatRates.length
    ? {
        min: round2(Math.min(...flatRates)),
        max: round2(Math.max(...flatRates)),
        avg: round2(flatRates.reduce((s, v) => s + v, 0) / flatRates.length),
      }
    : { min: 0, max: 0, avg: 0 };

  const lastUpdatedLabel = current.updatedAt
    ? new Date(current.updatedAt).toLocaleString()
    : "Not saved yet";

  // ---------- Excel import ----------
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const ws = workbook.Sheets[sheetName];

      // Expect columns: FAT, SNF, Rate
      const rows = XLSX.utils.sheet_to_json<RateChartExcelRow>(ws);

      if (!rows.length) {
        toast("Excel file is empty or has no data.");
        return;
      }

      const fatsSet = new Set<number>();
      const snfsSet = new Set<number>();

      rows.forEach((row) => {
        const fat = Number(row.FAT ?? row.fat ?? row.Fat);
        const snf = Number(row.SNF ?? row.snf ?? row.Snf);
        if (!Number.isNaN(fat) && !Number.isNaN(snf)) {
          fatsSet.add(fat);
          snfsSet.add(snf);
        }
      });

      const fats = Array.from(fatsSet).sort((a, b) => a - b);
      const snfs = Array.from(snfsSet).sort((a, b) => a - b);

      if (!fats.length || !snfs.length) {
        toast("Could not find FAT/SNF columns in the Excel file.");
        return;
      }

      // Initialize matrix
      const rates: number[][] = fats.map(() => snfs.map(() => 0));

      rows.forEach((row) => {
        const fat = Number(row.FAT ?? row.fat ?? row.Fat);
        const snf = Number(row.SNF ?? row.snf ?? row.Snf);
        const rate = Number(row.Rate ?? row.rate ?? row.RATE);
        if (!Number.isNaN(fat) && !Number.isNaN(snf) && !Number.isNaN(rate)) {
          const fi = fats.indexOf(fat);
          const si = snfs.indexOf(snf);
          if (fi !== -1 && si !== -1) {
            rates[fi][si] = rate;
          }
        }
      });

      const updatedChart: MilkRateChart = {
        ...current,
        fats,
        snfs,
        rates,
        effectiveFrom:
          current.effectiveFrom ?? new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString(),
      };

      setCurrent(updatedChart);
      toast.success(
        `Imported rate chart for ${activeMilkType} from ${sheetName}.`,
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to import Excel file. Please check format.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // ---------- RENDER ----------

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#5E503F]">Rate Chart</h1>
            <p className="text-sm text-[#5E503F]/70">
              Manage milk rate chart using FAT and SNF method for Cow and
              Buffalo milk.
            </p>
          </div>
        </div>

        {/* Tabs + summary cards */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {(["cow", "buffalo"] as MilkType[]).map((mt) => (
              <button
                key={mt}
                type="button"
                onClick={() => setActiveMilkType(mt)}
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  activeMilkType === mt
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                {mt === "cow" ? "🐄 Cow Milk" : "🐃 Buffalo Milk"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-[#5E503F]/70">
            <button
              type="button"
              onClick={handleImportClick}
              className="rounded-md border border-[#E9E2C8] bg-white px-3 py-1.5 text-xs font-medium text-[#5E503F] hover:bg-[#F8F4E3]"
            >
              Import from Excel
            </button>
            <span>Last updated: {lastUpdatedLabel}</span>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Base Rate"
            value={`₹ ${current.baseRate.toFixed(2)}`}
            subtitle="Base value in formula"
            variant="teal"
          />
          <StatCard
            title="FAT Factor"
            value={current.fatFactor.toFixed(2)}
            subtitle="Rate increase per FAT%"
            variant="orange"
          />
          <StatCard
            title="SNF Factor"
            value={current.snfFactor.toFixed(2)}
            subtitle="Rate increase per SNF%"
            variant="blue"
          />
          <StatCard
            title="Min / Avg / Max Rate"
            value={`₹ ${stats.min} / ₹ ${stats.avg} / ₹ ${stats.max}`}
            variant="green"
          />
        </div>

        {/* Formula + preview */}
        <div className="grid gap-4 lg:grid-cols-1">
          {/* Formula card */}
          <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold text-[#5E503F]">
              Formula Configuration
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <InputField
                label="Base Rate (₹)"
                type="number"
                step="0.01"
                value={String(current.baseRate)}
                onChange={(e) =>
                  handleFormulaChange("baseRate", e.target.value)
                }
              />
              <InputField
                label="FAT Factor"
                type="number"
                step="0.01"
                value={String(current.fatFactor)}
                onChange={(e) =>
                  handleFormulaChange("fatFactor", e.target.value)
                }
              />
              <InputField
                label="SNF Factor"
                type="number"
                step="0.01"
                value={String(current.snfFactor)}
                onChange={(e) =>
                  handleFormulaChange("snfFactor", e.target.value)
                }
              />
            </div>
            <p className="mt-2 text-xs text-[#5E503F]/70">
              Formula:{" "}
              <strong>Rate = Base + FAT × FatFactor + SNF × SNFFactor</strong>
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={regenerateFromFormula}
                className="rounded-md bg-[#2A9D8F] px-4 py-2 text-xs font-medium text-white shadow hover:bg-[#247B71]"
              >
                Apply Formula (Generate Chart)
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="rounded-md border border-[#E9E2C8] bg-white px-4 py-2 text-xs font-medium text-[#E76F51] hover:bg-[#E76F51]/10"
              >
                Reset to Default ({activeMilkType})
              </button>
            </div>
          </div>

          {/* Preview card */}
          {/* <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[#5E503F]">
              Rate Preview (FAT / SNF)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <InputField
                label="FAT %"
                type="number"
                step="0.1"
                value={previewFat}
                onChange={(e) => setPreviewFat(e.target.value)}
              />
              <InputField
                label="SNF %"
                type="number"
                step="0.1"
                value={previewSnf}
                onChange={(e) => setPreviewSnf(e.target.value)}
              />
            </div>
            {hasPreviewValues ? (
              <div className="mt-4 space-y-1 text-sm text-[#5E503F]">
                <div>
                  Formula Rate:{" "}
                  <span className="font-semibold text-[#2A9D8F]">
                    ₹{" "}
                    {typeof previewFormulaRate === "number"
                      ? previewFormulaRate.toFixed(2)
                      : "—"}
                  </span>
                </div>
                <div className="text-xs text-[#5E503F]/70">
                  Cell Rate (if exact FAT &amp; SNF exist in table):{" "}
                  {typeof previewMatrixRate === "number" ? (
                    <span className="font-semibold text-[#5E503F]">
                      ₹ {previewMatrixRate.toFixed(2)}
                    </span>
                  ) : (
                    <span>— (no exact cell)</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#5E503F]/60">
                Enter valid FAT and SNF values to see preview.
              </p>
            )}
          </div> */}
        </div>

        {/* Matrix editor */}
        <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#5E503F]">
              Rate Chart Matrix (FAT × SNF)
            </h2>
            <div className="flex items-center gap-3 text-xs text-[#5E503F]/70">
              <span>
                FAT rows: {current.fats.join(", ")} | SNF columns:{" "}
                {current.snfs.join(", ")}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-[#E9E2C8] bg-[#F8F4E3] px-2 py-1 text-left text-[11px] text-[#5E503F]">
                    FAT \ SNF
                  </th>
                  {current.snfs.map((snf) => (
                    <th
                      key={snf}
                      className="border border-[#E9E2C8] bg-[#F8F4E3] px-2 py-1 text-center text-[11px] text-[#5E503F]"
                    >
                      {snf.toFixed(1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.fats.map((fat, fi) => (
                  <tr key={fat}>
                    <th className="border border-[#E9E2C8] bg-[#F8F4E3] px-2 py-1 text-left text-[11px] text-[#5E503F]">
                      {fat.toFixed(1)}
                    </th>
                    {current.snfs.map((snf, si) => (
                      <td
                        key={snf}
                        className="border border-[#E9E2C8] px-1 py-[2px] text-center"
                      >
                        <input
                          type="number"
                          step="0.01"
                          className="w-20 rounded border border-[#E9E2C8] bg-white px-2 py-1 text-right text-[11px] text-[#5E503F] outline-none focus:ring-1 focus:ring-[#2A9D8F]"
                          value={current.rates[fi][si].toFixed(2)}
                          onChange={(e) =>
                            handleCellChange(fi, si, e.target.value)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save button */}
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-[#2A9D8F] px-5 py-2 text-sm font-medium text-white shadow hover:bg-[#247B71] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : "Save Rate Charts"}
            </button>
          </div>
        </div>
      </div>

      {/* Reset confirm modal */}
      <ConfirmModal
        open={showResetConfirm}
        title={`Reset ${activeMilkType} Rate Chart`}
        variant="danger"
        description={
          <div className="space-y-1 text-sm">
            <p>
              This will reset the entire <strong>{activeMilkType}</strong> rate
              chart back to the default formula‑based values.
            </p>
            <p className="text-xs text-[#5E503F]/70">
              Any manual changes you made in the matrix will be lost.
            </p>
          </div>
        }
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={resetToDefault}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
};

export default RateChartPage;
