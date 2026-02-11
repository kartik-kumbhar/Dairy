/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/statCard";
import InputField from "../../components/inputField";
import ReportSwitcher from "../../components/ReportSwitcher";
import {
  getDailyReport,
  getMilkYieldReport,
  getMonthlyMilkReport,
  type MilkEntry,
} from "../../axios/report_api";
import DataTable, { type DataTableColumn } from "../../components/dataTable";
// import html2pdf from "html2pdf.js";
// import { useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

type Mode = "daily" | "monthly";

const MilkYieldReportPage: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const [mode, setMode] = useState<Mode>("daily");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState<{ cow: any; buffalo: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  // const reportRef = useRef<HTMLDivElement>(null);

  const params = useMemo(() => {
    if (mode === "daily") {
      return { from: date, to: date };
    }
    return {
      from: `${month}-01`,
      to: `${month}-31`,
    };
  }, [mode, date, month]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await getMilkYieldReport(params);

        const { cow, buffalo } = res.data;

        setData({
          cow: cow ?? { liters: 0, amount: 0 },
          buffalo: buffalo ?? { liters: 0, amount: 0 },
        });

        // setData({ cow, buffalo });
      } catch (err) {
        console.error("Milk yield report failed", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params]);
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoadingEntries(true);

        if (mode === "daily") {
          const res = await getDailyReport(date);
          setEntries(res.data.entries);
        } else {
          const res = await getMonthlyMilkReport(month);
          setEntries(res.data.entries);
        }
      } catch (err) {
        console.error("Failed to load milk entries", err);
      } finally {
        setLoadingEntries(false);
      }
    };

    loadEntries();
  }, [mode, date, month]);

  const cowEntries = useMemo(
    () => entries.filter((e) => e.milkType === "cow"),
    [entries],
  );

  const buffaloEntries = useMemo(
    () => entries.filter((e) => e.milkType === "buffalo"),
    [entries],
  );

  const columns: DataTableColumn<MilkEntry>[] = [
    { id: "date", header: "Date", accessor: "date", align: "center" },
    { id: "shift", header: "Shift", accessor: "shift", align: "center" },
    {
      id: "farmer",
      header: "Farmer",
      align: "center",

      cell: (row) => row.farmerId.name,
    },
    {
      id: "liters",
      header: "Liters",
      align: "center",
      cell: (row) => row.quantity.toFixed(2),
    },
    {
      id: "amount",
      header: "Amount",
      align: "center",
      cell: (row) => `₹ ${row.totalAmount.toFixed(2)}`,
    },
  ];

  const formatRows = (list: MilkEntry[]) =>
    list.map((e) => ({
      Date: e.date,
      Shift: e.shift,
      Farmer: e.farmerId?.name ?? "-",
      Liters: Number(e.quantity).toFixed(2),
      Amount: Number(e.totalAmount).toFixed(2),
    }));

  // Export Excel
  const exportCowExcel = () => {
    if (!cowEntries.length) return toast.error("No cow records");

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formatRows(cowEntries));
    XLSX.utils.book_append_sheet(wb, ws, "Cow Milk");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "Cow-Milk.xlsx");
  };

  const exportBuffaloExcel = () => {
    if (!buffaloEntries.length) return toast.error("No buffalo records");

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formatRows(buffaloEntries));
    XLSX.utils.book_append_sheet(wb, ws, "Buffalo Milk");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "Buffalo-Milk.xlsx");
  };

  //Export PDF
  const exportCowPDF = () => {
    if (!cowEntries.length) return toast.error("No cow records");

    const doc = new jsPDF();
    doc.text("Cow Milk Report", 14, 10);

    autoTable(doc, {
      head: [["Date", "Shift", "Farmer", "Liters", "Amount"]],
      body: cowEntries.map((e) => [
        e.date,
        e.shift,
        e.farmerId?.name ?? "-",
        e.quantity.toFixed(2),
        `₹ ${e.totalAmount.toFixed(2)}`,
      ]),
      startY: 20,
    });

    doc.save("Cow-Milk.pdf");
  };

  const exportBuffaloPDF = () => {
    if (!buffaloEntries.length) return toast.error("No buffalo records");

    const doc = new jsPDF();
    doc.text("Buffalo Milk Report", 14, 10);

    autoTable(doc, {
      head: [["Date", "Shift", "Farmer", "Liters", "Amount"]],
      body: buffaloEntries.map((e) => [
        e.date,
        e.shift,
        e.farmerId?.name ?? "-",
        e.quantity.toFixed(2),
        `₹ ${e.totalAmount.toFixed(2)}`,
      ]),
      startY: 20,
    });

    doc.save("Buffalo-Milk.pdf");
  };

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#5E503F]">
              Milk Yield Report
            </h1>
            <p className="text-sm text-[#5E503F]/70">
              Cow vs Buffalo milk yield
            </p>
          </div>

          {mode === "daily" ? (
            <div className="w-48">
              <InputField
                label="Select Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          ) : (
            <div className="w-48">
              <InputField
                label="Select Month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          )}
        </div>

        <ReportSwitcher />

        {/* Daily / Monthly toggle */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setMode("daily")}
            className={`px-4 py-1.5 text-sm rounded-md ${
              mode === "daily"
                ? "bg-[#2A9D8F] text-white"
                : "bg-[#E9E2C8] text-[#5E503F]"
            }`}
          >
            Daily
          </button>

          <button
            onClick={() => setMode("monthly")}
            className={`px-4 py-1.5 text-sm rounded-md ${
              mode === "monthly"
                ? "bg-[#2A9D8F] text-white"
                : "bg-[#E9E2C8] text-[#5E503F]"
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Stats */}
        {loading || !data ? (
          <p className="text-sm text-[#5E503F]/60">Loading...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Cow Milk (L)"
              value={data.cow.liters.toFixed(2)}
              subtitle={`₹ ${data.cow.amount.toFixed(2)}`}
              variant="orange"
            />
            <StatCard
              title="Buffalo Milk (L)"
              value={data.buffalo.liters.toFixed(2)}
              subtitle={`₹ ${data.buffalo.amount.toFixed(2)}`}
              variant="blue"
            />
          </div>
        )}

        {loadingEntries ? (
          <p className="text-sm text-[#5E503F]/60">Loading entries...</p>
        ) : (
          <>
            <div className="space-y-4">
              {/* Cow Milk Table */}
              <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm space-y-3">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#5E503F]">
                    Cow Milk Collection
                  </h2>

                  <span className="text-xs text-[#5E503F]/60">
                    Total entries: {cowEntries.length}
                  </span>
                </div>

                <DataTable
                  data={cowEntries}
                  columns={columns}
                  keyField="_id"
                  striped
                  dense
                  emptyMessage="No cow milk records found."
                />
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={exportCowExcel}
                    className="rounded-md bg-green-600 px-3 py-2 text-white text-xs"
                  >
                    <i className="fa-solid fa-file-excel"></i> Excel
                  </button>
                  <button
                    onClick={exportCowPDF}
                    className="rounded-md bg-blue-600 px-3 py-2 text-white text-xs"
                  >
                    <i className="fa-solid fa-file-pdf"></i> PDF
                  </button>
                </div>
              </div>
              {/* Buffalo Milk Table */}
              <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#5E503F]">
                    Buffalo Milk Collection
                  </h2>
                  <span className="text-xs text-[#5E503F]/60">
                    Total entries: {buffaloEntries.length}
                  </span>
                </div>

                <DataTable
                  data={buffaloEntries}
                  columns={columns}
                  keyField="_id"
                  striped
                  dense
                  emptyMessage="No buffalo milk records found."
                />

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={exportBuffaloExcel}
                    className="rounded-md bg-green-600 px-3 py-2 text-white text-xs"
                  >
                    <i className="fa-solid fa-file-excel"></i> Excel
                  </button>

                  <button
                    onClick={exportBuffaloPDF}
                    className="rounded-md bg-blue-600 px-3 py-2 text-white text-xs"
                  >
                    <i className="fa-solid fa-file-pdf"></i> PDF
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default MilkYieldReportPage;
