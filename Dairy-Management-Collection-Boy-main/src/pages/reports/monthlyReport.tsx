// src/pages/reports/monthlyReport.tsx
import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/statCard";
import DataTable, { type DataTableColumn } from "../../components/dataTable";

import ReportSwitcher from "../../components/ReportSwitcher";
import { getMonthlyMilkReport } from "../../axios/report_api";
import type { MonthlyMilkReportResponse } from "../../axios/report_api";

import { useNavigate } from "react-router-dom";

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

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const [report, setReport] = useState<MonthlyMilkReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getMonthlyMilkReport(selectedMonth);
        setReport(res.data);
      } catch (err) {
        console.error("Monthly report failed", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [selectedMonth]);

  const dayColumns: DataTableColumn<DaySummary>[] = [
    {
      id: "date",
      header: "Date",
      align: "center",
      accessor: "date",
    },
    {
      id: "liters",
      header: "Total Liters",
      align: "center",
      cell: (row) => row.liters.toFixed(2),
    },
    {
      id: "amount",
      header: "Total Amount",
      align: "center",
      cell: (row) => `₹ ${row.amount.toFixed(2)}`,
    },
  ];

  const farmerColumns: DataTableColumn<FarmerSummary>[] = [
    {
      id: "code",
      header: "Farmer Code",
      align: "center",
      accessor: "farmerCode",
    },
    {
      id: "name",
      header: "Farmer Name",
      align: "center",
      accessor: "farmerName",
    },
    {
      id: "liters",
      header: "Total Liters",
      align: "center",
      cell: (row) => row.liters.toFixed(2),
    },
    {
      id: "amount",
      header: "Total Amount",
      align: "center",
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
              className="mt-1 w-full rounded-md border border-[#E9E2C8] bg-white px-3 py-2 text-sm text-[#5E503F]"
            />
          </div>
        </div>
        <ReportSwitcher />

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/reports/daily")}
            className="px-4 py-1.5 text-sm rounded-md bg-[#E9E2C8] text-[#5E503F]"
          >
            Daily
          </button>

          <button
            onClick={() => navigate("/reports/monthly")}
            className="px-4 py-1.5 text-sm rounded-md bg-[#2A9D8F] text-white"
          >
            Monthly
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Liters"
            value={report?.totalLiters.toFixed(2) ?? "0.00"}
            subtitle={monthLabel}
            variant="teal"
          />
          <StatCard
            title="Total Amount (₹)"
            value={report?.totalAmount.toFixed(2) ?? "0.00"}
            subtitle={monthLabel}
            variant="blue"
          />
          <StatCard
            title="Cow / Buffalo (L)"
            value={`${report?.cowLiters ?? 0} / ${report?.buffaloLiters ?? 0}`}
            subtitle="Cow / Buffalo"
            variant="orange"
          />
          
          <StatCard
            title="Days / Farmers / Entries"
            value={`${report?.dayCount ?? 0} / ${report?.farmerCount ?? 0} / ${report?.entryCount ?? 0}`}
            subtitle="Days / Farmers / Collections"
            variant="green"
          />
        </div>

        {loading ? (
          <p className="text-sm text-[#5E503F]/60">Loading...</p>
        ) : (
          <>
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
                data={report?.dayRows ?? []}
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
                data={report?.farmerRows ?? []}
                columns={farmerColumns}
                keyField="farmerId"
                dense
                striped
                emptyMessage="No farmer collection entries in this month."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MonthlyReportPage;
