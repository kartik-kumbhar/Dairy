import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/statCard";
import DataTable, { type DataTableColumn } from "../../components/dataTable";
import InputField from "../../components/inputField";
import { getInventoryItems } from "../../axios/inventory_api";
import type { InventoryItem } from "../../types/inventory";
import ReportSwitcher from "../../components/ReportSwitcher";

type Mode = "Daily" | "Monthly";

const InventoryReportPage: React.FC = () => {
  const todayISO = new Date().toISOString().slice(0, 10);
  const monthISO = todayISO.slice(0, 7);

  const [mode, setMode] = useState<Mode>("Daily");
  const [date, setDate] = useState(todayISO);
  const [month, setMonth] = useState(monthISO);

  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const res = await getInventoryItems();
      setItems(res.data);
    };
    load();
  }, []);

  /* ---------------- stats ---------------- */
  const filteredItems = useMemo(() => {
    if (mode === "Daily") {
      return items.filter((i) => {
        if (!i.updatedAt) return false;
        return i.updatedAt.slice(0, 10) === date;
      });
    }

    // Monthly
    return items.filter((i) => {
      if (!i.updatedAt) return false;
      return i.updatedAt.slice(0, 7) === month;
    });
  }, [items, mode, date, month]);

  const stats = useMemo(() => {
    const totalItems = filteredItems.length;
    let lowStock = 0;
    let outOfStock = 0;
    let stockValue = 0;

    filteredItems.forEach((i) => {
      const stock = i.currentStock ?? 0;
      const min = i.minStock ?? 0;

      if (stock <= 0) outOfStock += 1;
      else if (stock < min) lowStock += 1;

      if (i.purchaseRate != null) {
        stockValue += stock * i.purchaseRate;
      }
    });

    return { totalItems, lowStock, outOfStock, stockValue };
  }, [filteredItems]);

  /* ---------------- table ---------------- */

  const columns: DataTableColumn<InventoryItem>[] = [
    { id: "code", header: "Code", accessor: "code", align: "center" },
    { id: "name", header: "Item Name", accessor: "name", align: "center" },
    {
      id: "category",
      header: "Category",
      accessor: "category",
      align: "center",
    },
    {
      id: "stock",
      header: "Stock",
      align: "center",
      cell: (row) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            (row.currentStock ?? 0) <= 0
              ? "bg-red-100 text-red-700"
              : (row.currentStock ?? 0) < (row.minStock ?? 0)
                ? "bg-[#F4A261]/20 text-[#A45C20]"
                : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {(row.currentStock ?? 0).toFixed(2)} {row.unit}
        </span>
      ),
    },
    {
      id: "value",
      header: "Stock Value",
      align: "center",
      cell: (row) =>
        row.purchaseRate != null
          ? `₹ ${((row.currentStock ?? 0) * row.purchaseRate).toFixed(2)}`
          : "-",
    },
  ];

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#5E503F]">
            Inventory Report
          </h1>
          <p className="text-sm text-[#5E503F]/70">
            Daily and monthly inventory stock summary
          </p>
        </div>

        <ReportSwitcher />

        {/* Daily / Monthly toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode("Daily")}
            className={`px-4 py-1.5 text-sm rounded-md ${
              mode === "Daily"
                ? "bg-[#2A9D8F] text-white"
                : "bg-[#E9E2C8] text-[#5E503F]"
            }`}
          >
            Daily
          </button>

          <button
            onClick={() => setMode("Monthly")}
            className={`px-4 py-1.5 text-sm rounded-md ${
              mode === "Monthly"
                ? "bg-[#2A9D8F] text-white"
                : "bg-[#E9E2C8] text-[#5E503F]"
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Date / Month */}
        <div className="flex justify-end">
          {mode === "Daily" ? (
            <InputField
              label="Select Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              containerClassName="w-40"
            />
          ) : (
            <InputField
              label="Select Month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              containerClassName="w-40"
            />
          )}
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            variant="teal"
          />
          <StatCard title="Low Stock" value={stats.lowStock} variant="orange" />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStock}
            variant="red"
          />
          <StatCard
            title="Stock Value (₹)"
            value={stats.stockValue.toFixed(2)}
            variant="blue"
          />
        </div>

        {/* Table */}
        <DataTable
          data={filteredItems}
          columns={columns}
          keyField="_id"
          striped
          dense
          emptyMessage={
            mode === "Daily"
              ? "No inventory updates found for selected date."
              : "No inventory updates found for selected month."
          }
        />
      </div>
    </div>
  );
};

export default InventoryReportPage;
