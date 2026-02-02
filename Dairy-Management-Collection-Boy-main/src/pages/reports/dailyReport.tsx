// src/pages/reports/dailyReport.tsx
import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/statCard";
import DataTable, { type DataTableColumn } from "../../components/dataTable";
import InputField from "../../components/inputField";

import { StorageKey } from "../../storage/storageKeys";
import { getJSON } from "../../storage/localStorage";
import type { MilkCollection, MilkShift } from "../../types/milkCollection";
import type { Farmer } from "../../types/farmer";

const DailyReportPage: React.FC = () => {
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [allCollections, setAllCollections] = useState<MilkCollection[]>([]);
  const [, setFarmers] = useState<Farmer[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);

  useEffect(() => {
    const collections = getJSON<MilkCollection[]>(
      StorageKey.MilkCollections,
      [],
    );
    const farmersList = getJSON<Farmer[]>(StorageKey.Farmers, []);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAllCollections(collections);
    setFarmers(farmersList);
  }, []);

  const collectionsForDay = useMemo(
    () => allCollections.filter((c) => c.date === selectedDate),
    [allCollections, selectedDate],
  );

  const stats = useMemo(() => {
    let totalLiters = 0;
    let totalAmount = 0;
    let cowLiters = 0;
    let buffaloLiters = 0;
    let morningLiters = 0;
    let eveningLiters = 0;

    const uniqueFarmerIds = new Set<string>();

    collectionsForDay.forEach((c) => {
      totalLiters += c.liters;
      totalAmount += c.amount;
      uniqueFarmerIds.add(c.farmerId);

      if (c.milkType === "cow") cowLiters += c.liters;
      if (c.milkType === "buffalo") buffaloLiters += c.liters;

      if (c.shift === "Morning") morningLiters += c.liters;
      if (c.shift === "Evening") eveningLiters += c.liters;
    });

    return {
      totalLiters,
      totalAmount,
      cowLiters,
      buffaloLiters,
      morningLiters,
      eveningLiters,
      farmerCount: uniqueFarmerIds.size,
      collectionCount: collectionsForDay.length,
    };
  }, [collectionsForDay]);

  const columns: DataTableColumn<MilkCollection>[] = [
    {
      id: "time",
      header: "Shift",
      accessor: "shift",
    },
    {
      id: "farmerCode",
      header: "Farmer Code",
      accessor: "farmerCode",
    },
    {
      id: "farmerName",
      header: "Farmer Name",
      accessor: "farmerName",
    },
    {
      id: "milkType",
      header: "Milk Type",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            row.milkType === "cow"
              ? "bg-[#E76F51]/10 text-[#E76F51]"
              : "bg-[#457B9D]/10 text-[#457B9D]"
          }`}
        >
          {row.milkType === "cow" ? "🐄" : "🐃"} {row.milkType}
        </span>
      ),
    },
    {
      id: "liters",
      header: "Liters",
      align: "right",
      cell: (row) => row.liters.toFixed(2),
    },
    {
      id: "fat",
      header: "FAT %",
      align: "right",
      cell: (row) => row.fat.toFixed(1),
    },
    {
      id: "snf",
      header: "SNF %",
      align: "right",
      cell: (row) => row.snf.toFixed(1),
    },
    {
      id: "rate",
      header: "Rate",
      align: "right",
      cell: (row) => `₹ ${row.rate.toFixed(2)}`,
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      cell: (row) => `₹ ${row.amount.toFixed(2)}`,
    },
  ];

  const handleQuickShiftFilter = (shift: MilkShift | "All") => {
    if (shift === "All") {
      // nothing, table will show all; we could add separate filter if needed
      return;
    }
    // Simple implementation: not storing separate filter; just scroll to first row
    const index = collectionsForDay.findIndex((c) => c.shift === shift);
    if (index !== -1) {
      const rowId = `row-${collectionsForDay[index]._id}`;
      const el = document.getElementById(rowId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#5E503F]">Daily Report</h1>
            <p className="text-sm text-[#5E503F]/70">
              Summary of milk collection for a selected date.
            </p>
          </div>
          <div className="w-48">
            <InputField
              label="Select Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Liters"
            value={stats.totalLiters.toFixed(2)}
            subtitle={`Collections: ${stats.collectionCount}`}
            variant="teal"
          />
          <StatCard
            title="Total Amount (₹)"
            value={stats.totalAmount.toFixed(2)}
            subtitle={`Farmers: ${stats.farmerCount}`}
            variant="blue"
          />
          <StatCard
            title="Cow / Buffalo (L)"
            value={`${stats.cowLiters.toFixed(
              1,
            )} / ${stats.buffaloLiters.toFixed(1)}`}
            variant="orange"
          />
          <StatCard
            title="Morning / Evening (L)"
            value={`${stats.morningLiters.toFixed(
              1,
            )} / ${stats.eveningLiters.toFixed(1)}`}
            variant="red"
          />
        </div>

        {/* Quick shift buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[#5E503F]">
            Quick Shift Focus:
          </span>
          <button
            type="button"
            onClick={() => handleQuickShiftFilter("All")}
            className="rounded-md bg-[#E9E2C8] px-3 py-1.5 text-xs text-[#5E503F]"
          >
            All
          </button>
          <button
            type="button"
            onClick={() => handleQuickShiftFilter("Morning")}
            className="rounded-md bg-[#E9E2C8] px-3 py-1.5 text-xs text-[#5E503F]"
          >
            Morning
          </button>
          <button
            type="button"
            onClick={() => handleQuickShiftFilter("Evening")}
            className="rounded-md bg-[#E9E2C8] px-3 py-1.5 text-xs text-[#5E503F]"
          >
            Evening
          </button>
          <span className="text-xs text-[#5E503F]/60">
            (Scrolls to first entry of that shift)
          </span>
        </div>

        {/* Table */}
        <DataTable
          data={collectionsForDay}
          columns={columns}
          keyField="_id"
          striped
          dense
          emptyMessage="No milk collection entries for the selected date."
        />
      </div>
    </div>
  );
};

export default DailyReportPage;
