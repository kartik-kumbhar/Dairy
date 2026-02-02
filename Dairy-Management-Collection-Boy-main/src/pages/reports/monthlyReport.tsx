// src/pages/reports/monthlyReport.tsx
import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/statCard";
import DataTable, { type DataTableColumn } from "../../components/dataTable";

import { StorageKey } from "../../storage/storageKeys";
import { getJSON } from "../../storage/localStorage";
import type { MilkCollection } from "../../types/milkCollection";
import type { Farmer } from "../../types/farmer";

interface DaySummary {
  date: string;
  liters: number;
  amount: number;
}

interface FarmerSummary {
  farmerId: string;
  farmerCode: string;
  farmerName: string;
  liters: number;
  amount: number;
}

const MonthlyReportPage: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const defaultMonth = useMemo(
    () => today.toISOString().slice(0, 7), // YYYY-MM
    [today],
  );

  const [allCollections, setAllCollections] = useState<MilkCollection[]>([]);
  const [, setFarmers] = useState<Farmer[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);

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

  const monthCollections = useMemo(
    () => allCollections.filter((c) => c.date.slice(0, 7) === selectedMonth),
    [allCollections, selectedMonth],
  );

  const stats = useMemo(() => {
    let liters = 0;
    let amount = 0;
    let cowLiters = 0;
    let buffaloLiters = 0;

    const uniqueDays = new Set<string>();
    const uniqueFarmers = new Set<string>();

    monthCollections.forEach((c) => {
      liters += c.liters;
      amount += c.amount;
      uniqueDays.add(c.date);
      uniqueFarmers.add(c.farmerId);
      if (c.milkType === "cow") cowLiters += c.liters;
      if (c.milkType === "buffalo") buffaloLiters += c.liters;
    });

    return {
      liters,
      amount,
      cowLiters,
      buffaloLiters,
      dayCount: uniqueDays.size,
      farmerCount: uniqueFarmers.size,
      collectionCount: monthCollections.length,
    };
  }, [monthCollections]);

  // Build per-day summary
  const dayRows: DaySummary[] = useMemo(() => {
    const map = new Map<string, DaySummary>();
    monthCollections.forEach((c) => {
      const existing = map.get(c.date);
      if (!existing) {
        map.set(c.date, {
          date: c.date,
          liters: c.liters,
          amount: c.amount,
        });
      } else {
        existing.liters += c.liters;
        existing.amount += c.amount;
      }
    });
    const list = Array.from(map.values());
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }, [monthCollections]);

  // Build per-farmer summary
  const farmerRows: FarmerSummary[] = useMemo(() => {
    const map = new Map<string, FarmerSummary>();
    monthCollections.forEach((c) => {
      const key = c.farmerId;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          farmerId: c.farmerId,
          farmerCode: c.farmerCode,
          farmerName: c.farmerName,
          liters: c.liters,
          amount: c.amount,
        });
      } else {
        existing.liters += c.liters;
        existing.amount += c.amount;
      }
    });
    const list = Array.from(map.values());
    list.sort((a, b) => a.farmerName.localeCompare(b.farmerName));
    return list;
  }, [monthCollections]);

  const dayColumns: DataTableColumn<DaySummary>[] = [
    {
      id: "date",
      header: "Date",
      accessor: "date",
    },
    {
      id: "liters",
      header: "Total Liters",
      align: "right",
      cell: (row) => row.liters.toFixed(2),
    },
    {
      id: "amount",
      header: "Total Amount",
      align: "right",
      cell: (row) => `₹ ${row.amount.toFixed(2)}`,
    },
  ];

  const farmerColumns: DataTableColumn<FarmerSummary>[] = [
    {
      id: "code",
      header: "Farmer Code",
      accessor: "farmerCode",
    },
    {
      id: "name",
      header: "Farmer Name",
      accessor: "farmerName",
    },
    {
      id: "liters",
      header: "Total Liters",
      align: "right",
      cell: (row) => row.liters.toFixed(2),
    },
    {
      id: "amount",
      header: "Total Amount",
      align: "right",
      cell: (row) => `₹ ${row.amount.toFixed(2)}`,
    },
  ];

  const monthLabel = useMemo(() => {
    if (!selectedMonth) return "";
    const [year, month] = selectedMonth.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
    });
  }, [selectedMonth]);

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#5E503F]">
              Monthly Report
            </h1>
            <p className="text-sm text-[#5E503F]/70">
              Summary of milk collection for selected month.
            </p>
          </div>
          <div className="w-48">
            <label className="text-xs font-medium text-[#5E503F]">
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#E9E2C8] bg-white px-3 py-2 text-sm text-[#5E503F] outline-none focus:ring-2 focus:ring-[#2A9D8F]"
            />
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Liters"
            value={stats.liters.toFixed(2)}
            subtitle={monthLabel}
            variant="teal"
          />
          <StatCard
            title="Total Amount (₹)"
            value={stats.amount.toFixed(2)}
            subtitle={monthLabel}
            variant="blue"
          />
          <StatCard
            title="Cow / Buffalo (L)"
            value={`${stats.cowLiters.toFixed(
              1,
            )} / ${stats.buffaloLiters.toFixed(1)}`}
            subtitle="Cow / Buffalo"
            variant="orange"
          />
          <StatCard
            title="Days / Farmers / Entries"
            value={`${stats.dayCount} / ${stats.farmerCount} / ${stats.collectionCount}`}
            subtitle="Days / Farmers / Collections"
            variant="green"
          />
        </div>

        {/* Per-day summary */}
        <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#5E503F]">
              Daily Summary ({monthLabel})
            </h2>
            <span className="text-xs text-[#5E503F]/60">
              Total liters & amount by day.
            </span>
          </div>
          <DataTable
            data={dayRows}
            columns={dayColumns}
            keyField="date"
            dense
            striped
            emptyMessage="No milk collection entries in this month."
          />
        </div>

        {/* Per-farmer summary */}
        <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#5E503F]">
              Farmer Summary ({monthLabel})
            </h2>
            <span className="text-xs text-[#5E503F]/60">
              Total liters & amount by farmer.
            </span>
          </div>
          <DataTable
            data={farmerRows}
            columns={farmerColumns}
            keyField="farmerId"
            dense
            striped
            emptyMessage="No farmer collection entries in this month."
          />
        </div>
      </div>
    </div>
  );
};

export default MonthlyReportPage;
