// src/pages/milkCollection/milkEntry.tsx
import React, { useEffect, useMemo, useState } from "react";

import InputField from "../../components/inputField";
import Loader from "../../components/loader";

import { getFarmers } from "../../axios/farmer_api";
import {
  addMilkEntry,
  deleteMilkEntry,
  getMilkEntries,
  getRateForMilk,
} from "../../axios/milk_api";

import type { MilkCollection, MilkShift } from "../../types/milkCollection";
import type { Farmer, MilkType } from "../../types/farmer";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/confirmModal";

type DateFilterMode = "day" | "month" | "all";

const getDefaultShift = (): MilkShift => {
  const now = new Date();
  const hour = now.getHours(); // 0–23

  return hour < 12 ? "Morning" : "Evening";
};

const MilkEntryPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => today.toISOString().slice(0, 10), [today]);
  const todayMonth = useMemo(
    () => today.toISOString().slice(0, 7), // YYYY-MM
    [today],
  );

  // Farmers
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loadingFarmers, setLoadingFarmers] = useState(true);

  // Collections
  const [collections, setCollections] = useState<MilkCollection[]>([]);

  // Form state
  const [date, setDate] = useState<string>(todayISO);
  const [shift, setShift] = useState<MilkShift>(() => getDefaultShift());
  const [farmerId, setFarmerId] = useState<string>("");
  const [liters, setLiters] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [snf, setSnf] = useState<string>("");
  const [rate, setRate] = useState<string>("0.00");
  const [loadingRate, setLoadingRate] = useState(false);
  const [milkType, setMilkType] = useState<MilkType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MilkCollection | null>(null);

  const [remarks, setRemarks] = useState<string>("");

  const [errors, setErrors] = useState<{
    date?: string;
    farmerId?: string;
    liters?: string;
    fat?: string;
    snf?: string;
    rate?: string;
  }>({});
  const [saving, setSaving] = useState(false);

  // Filter state for list
  const [filterMode, setFilterMode] = useState<DateFilterMode>("day");
  const [filterDate, setFilterDate] = useState<string>(todayISO);
  const [filterMonth, setFilterMonth] = useState<string>(todayMonth);

  const selectedFarmer = useMemo(
    () => farmers.find((f) => f._id === farmerId),
    [farmers, farmerId],
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [farmerRes, milkRes] = await Promise.all([
          getFarmers(),
          getMilkEntries(),
        ]);

        setFarmers(farmerRes.data);
        setCollections(milkRes.data);
      } catch (err) {
        console.error("Failed to load data:", err);
        toast.error("Failed to load farmers or milk entries");
      } finally {
        setLoadingFarmers(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedFarmer) return;

    if (selectedFarmer.milkType.length === 1) {
      setMilkType(selectedFarmer.milkType[0]);
    } else {
      setMilkType(null);
    }
  }, [selectedFarmer]);

  useEffect(() => {
    if (date === todayISO) {
      setShift(getDefaultShift());
    }
  }, [date, todayISO]);

  useEffect(() => {
    const fetchRate = async () => {
      if (!selectedFarmer || !milkType || !fat || !snf || !date) return;

      try {
        setLoadingRate(true);

        const res = await getRateForMilk({
          // milkType: selectedFarmer.milkType,
          milkType,
          fat: Number(fat),
          snf: Number(snf),
          date,
        });

        setRate(res.data.rate.toFixed(2));
      } catch (err) {
        console.error("Rate fetch failed", err);
        setRate("0.00");
      } finally {
        setLoadingRate(false);
      }
    };

    fetchRate();
  }, [selectedFarmer, fat, snf, date, milkType]);

  const handleSave = async () => {
    if (!validate() || !selectedFarmer) return;
    if (!milkType) {
      toast.error("Please select milk type");
      return false;
    }

    try {
      setSaving(true);

      await addMilkEntry({
        date,
        shift,
        farmerId: selectedFarmer._id,
        milkType,
        quantity: Number(liters),
        fat: Number(fat),
        snf: Number(snf),
        rate: Number(rate),
      });

      const refreshed = await getMilkEntries();
      setCollections(refreshed.data);
      toast.success("Milk collection saved successfully");
      resetForm();
    } catch (err) {
      console.error("Failed to save milk entry:", err);
      toast.error("Milk entry already exists for this farmer, date and shift.");
    } finally {
      setSaving(false);
    }
  };

  const litersNum = parseFloat(liters) || 0;
  const rateNum = parseFloat(rate) || 0;
  const amount = litersNum * rateNum;

  // ---------- VALIDATION ----------
  const validate = () => {
    const next: typeof errors = {};
    const litersVal = parseFloat(liters);
    const fatVal = parseFloat(fat);
    const snfVal = parseFloat(snf);
    if (Number(rate) <= 0) {
      toast.error("Rate not available for this FAT/SNF");
      return false;
    }

    if (!date) next.date = "Date is required.";
    if (!farmerId) next.farmerId = "Farmer is required.";
    if (!liters || litersVal <= 0 || Number.isNaN(litersVal)) {
      next.liters = "Liters must be greater than 0.";
    }
    if (!fat || Number.isNaN(fatVal)) next.fat = "Enter FAT%";
    if (!snf || Number.isNaN(snfVal)) next.snf = "Enter SNF%";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setDate(todayISO);
    setShift("Morning");
    setFarmerId("");
    setLiters("");
    setFat("");
    setSnf("");
    setRate("0.00");
    setRemarks("");
    setErrors({});
  };

  // ---------- FILTERED COLLECTIONS ----------

  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      if (filterMode === "day") {
        return c.date === filterDate;
      }
      if (filterMode === "month") {
        return c.date.slice(0, 7) === filterMonth;
      }
      return true; // "all"
    });
  }, [collections, filterMode, filterDate, filterMonth]);

  // ---------- UI derived ----------
  const farmerCode = selectedFarmer?.code ?? "";

  const farmerOptions = farmers.map((f) => ({
    label: `${f.code} - ${f.name}`,
    value: f._id,
  }));

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMilkEntry(deleteTarget._id);

      setCollections((prev) => prev.filter((c) => c._id !== deleteTarget._id));

      toast.success("Milk entry deleted successfully");
      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete milk entry");
    }
  };

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#5E503F]">Milk Collection</h1>
          <p className="text-sm text-[#5E503F]/70">
            Record daily milk collection data.
          </p>
        </div>

        {/* Entry Card */}
        <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm">
          {loadingFarmers ? (
            <div className="flex items-center justify-center py-10">
              <Loader size="md" message="Loading farmers..." />
            </div>
          ) : farmers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-sm text-[#5E503F]/70">
              <p>No farmers found. Please add farmers first.</p>
            </div>
          ) : (
            <>
              {/* First row: Date, Shift, Farmer Name */}
              <div className="grid gap-4 md:grid-cols-3">
                <InputField
                  label="Date"
                  requiredLabel
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  error={errors.date}
                />

                <div>
                  <label className="text-xs font-medium text-[#5E503F]">
                    Shift <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as MilkShift)}
                    className="mt-1 w-full rounded-md border border-[#E9E2C8] bg-white px-3 py-2 text-sm text-[#5E503F] outline-none focus:ring-2 focus:ring-[#2A9D8F]"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#5E503F]">
                    Farmer<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={farmerId}
                    onChange={(e) => setFarmerId(e.target.value)}
                    className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-[#5E503F] outline-none focus:ring-2 focus:ring-[#2A9D8F] ${
                      errors.farmerId ? "border-red-500" : "border-[#E9E2C8]"
                    }`}
                  >
                    <option value="">Select farmer</option>
                    {farmerOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.farmerId && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.farmerId}
                    </p>
                  )}
                </div>
              </div>
              {/* Milk type if they have both Cow & Buffalo */}
              {selectedFarmer && selectedFarmer.milkType.length > 1 && (
                <div className="mt-4">
                  <span className="text-xs font-medium text-[#5E503F]">
                    Milk Type <span className="text-red-500">*</span>
                  </span>

                  <div className="mt-1 flex gap-3">
                    {selectedFarmer.milkType.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMilkType(t)}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm font-medium ${
                          milkType === t
                            ? "border-[#2A9D8F] bg-[#2A9D8F]/10 text-[#2A9D8F]"
                            : "border-[#E9E2C8] text-[#5E503F]"
                        }`}
                      >
                        {t === "cow" ? "🐄 Cow Milk" : "🐃 Buffalo Milk"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Second row: Farmer Code, Liters, Fat, SNF */}
              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <InputField
                  label="Farmer Code"
                  value={farmerCode}
                  readOnly
                  helperText="Auto-filled from farmer selection"
                />
                <InputField
                  label="Liters"
                  requiredLabel
                  type="number"
                  step="0.01"
                  min="0"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  error={errors.liters}
                />
                <InputField
                  label="Fat %"
                  requiredLabel
                  type="number"
                  step="0.1"
                  min="0"
                  helperText=" must be > 3"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  error={errors.fat}
                />
                <InputField
                  label="SNF %"
                  requiredLabel
                  type="number"
                  step="0.1"
                  min={7}
                  max={9.5}
                  helperText=" must be > 7"
                  value={snf}
                  onChange={(e) => setSnf(e.target.value)}
                  error={errors.snf}
                />
              </div>

              {/* Third row: Rate, Total Amount, Save */}
              <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <InputField
                  label="Rate (₹)"
                  value={loadingRate ? "Fetching..." : rate}
                  readOnly
                  helperText="Auto-calculated from rate chart"
                />

                <InputField
                  label="Total Amount (₹)"
                  value={amount.toFixed(2)}
                  readOnly
                />
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full rounded-md bg-[#2A9D8F] px-4 py-3 text-sm font-medium text-white shadow hover:bg-[#247B71] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? "Saving..." : "Save Collection"}
                  </button>
                </div>
              </div>

              {/* Remarks */}
              <div className="mt-4">
                <label className="text-xs font-medium text-[#5E503F]">
                  Remarks (optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-md border border-[#E9E2C8] bg-white px-3 py-2 text-sm text-[#5E503F] outline-none focus:ring-2 focus:ring-[#2A9D8F]"
                  placeholder="Any notes about this collection..."
                />
              </div>
            </>
          )}
        </div>

        {/* List + Filters */}
        <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <h2 className="text-sm font-semibold text-[#5E503F]">
              Collections
            </h2>

            {/* Filter mode */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#5E503F]">
                Filter:
              </span>
              <button
                type="button"
                onClick={() => setFilterMode("day")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  filterMode === "day"
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("month")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  filterMode === "month"
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("all")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  filterMode === "all"
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                All
              </button>
            </div>

            {/* Day / Month inputs */}
            {filterMode === "day" && (
              <InputField
                label="Day"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                containerClassName="w-40"
              />
            )}
            {filterMode === "month" && (
              <div className="w-40">
                <label className="text-xs font-medium text-[#5E503F]">
                  Month
                </label>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="mt-1 w-full rounded-md border border-[#E9E2C8] bg-white px-3 py-2 text-sm text-[#5E503F] outline-none focus:ring-2 focus:ring-[#2A9D8F]"
                />
              </div>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-[#E9E2C8]">
            <table className="min-w-full border-collapse text-xs">
              <thead className="bg-[#F8F4E3]">
                <tr>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-left font-semibold text-[#5E503F]">
                    Date
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-left font-semibold text-[#5E503F]">
                    Shift
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-left font-semibold text-[#5E503F]">
                    Farmer Code
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-left font-semibold text-[#5E503F]">
                    Farmer Name
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-center font-semibold text-[#5E503F]">
                    Milk Type
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-center font-semibold text-[#5E503F]">
                    Liters
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-center font-semibold text-[#5E503F]">
                    Fat %
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-center font-semibold text-[#5E503F]">
                    SNF %
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-center font-semibold text-[#5E503F]">
                    Rate (₹)
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-center font-semibold text-[#5E503F]">
                    Total (₹)
                  </th>
                  <th className="border-b border-[#E9E2C8] px-3 py-2 text-center font-semibold text-[#5E503F]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCollections.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-6 text-center text-xs text-[#5E503F]/60"
                    >
                      No collections recorded for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredCollections.map((c, index) => (
                    <tr
                      key={c._id}
                      className={index % 2 === 0 ? "bg-white" : "bg-[#FDFCF8]"}
                    >
                      <td className="border-t border-[#E9E2C8] px-3 py-2">
                        {c.date}
                      </td>
                      <td className="border-t border-[#E9E2C8] px-3 py-2">
                        {c.shift}
                      </td>
                      <td className="border-t border-[#E9E2C8] px-3 py-2">
                        {c.farmerCode}
                      </td>
                      <td className="border-t border-[#E9E2C8] px-3 py-2">
                        {c.farmerName}
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                            c.milkType === "cow"
                              ? "bg-[#E76F51]/10 text-[#E76F51]"
                              : "bg-[#457B9D]/10 text-[#457B9D]"
                          }`}
                        >
                          {c.milkType === "cow" ? "🐄 Cow" : "🐃 Buffalo"}
                        </span>
                      </td>
                      <td className="border-t border-[#E9E2C8] px-3 py-2 text-center">
                        {c.liters.toFixed(2)}
                      </td>
                      <td className="border-t border-[#E9E2C8] px-3 py-2 text-center">
                        {c.fat.toFixed(1)}
                      </td>
                      <td className="border-t border-[#E9E2C8] px-3 py-2 text-center">
                        {c.snf.toFixed(1)}
                      </td>
                      <td className="border-t border-[#E9E2C8] px-3 py-2 text-center">
                        {c.rate.toFixed(2)}
                      </td>
                      <td className="border-t border-[#E9E2C8] px-3 py-2 text-center">
                        {c.amount.toFixed(2)}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="rounded-md border border-[#E9E2C8] bg-white px-2 py-1 text-xs text-[#E76F51] hover:bg-[#E76F51]/10"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Milk Entry"
        variant="danger"
        description={
          deleteTarget && (
            <div className="space-y-1 text-sm">
              <p>Are you sure you want to delete this milk collection entry?</p>
              <p className="text-xs text-[#5E503F]/70">
                {deleteTarget.date} – {deleteTarget.shift} –{" "}
                {deleteTarget.farmerCode} ({deleteTarget.farmerName}) –{" "}
                {deleteTarget.liters.toFixed(2)} L
              </p>
            </div>
          )
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default MilkEntryPage;
