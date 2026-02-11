import React, { useEffect, useState } from "react";
import StatCard from "../../components/statCard";
import DataTable, { type DataTableColumn } from "../../components/dataTable";
import ReportSwitcher from "../../components/ReportSwitcher";
import { getMonthlyBillingReport } from "../../axios/report_api";
import type { MonthlyBillingReportResponse } from "../../axios/report_api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

const BillingReportPage: React.FC = () => {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}`;
  const [month, setMonth] = useState(defaultMonth);
  const [report, setReport] = useState<MonthlyBillingReportResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getMonthlyBillingReport(month);
        setReport(res.data);
      } catch (err) {
        console.error("Billing report failed", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  const columns: DataTableColumn<
    MonthlyBillingReportResponse["rows"][number]
  >[] = [
    {
      id: "farmer",
      header: "Farmer",
      align: "center",
      cell: (r) => (typeof r.farmerId === "object" ? r.farmerId.name : "—"),
    },

    {
      id: "liters",
      header: "Liters",
      align: "center",
      cell: (r) => r.totalLiters.toFixed(2),
    },
    {
      id: "milk",
      header: "Milk Amount",
      align: "center",
      cell: (r) => `₹ ${r.totalMilkAmount.toFixed(2)}`,
    },
    {
      id: "deduction",
      header: "Deduction",
      align: "center",
      cell: (r) => `₹ ${r.totalDeduction.toFixed(2)}`,
    },
    {
      id: "bonus",
      header: "Bonus",
      align: "center",
      cell: (r) => `₹ ${r.totalBonus.toFixed(2)}`,
    },
    {
      id: "net",
      header: "Net Payable",
      align: "center",
      cell: (r) => `₹ ${r.netPayable.toFixed(2)}`,
    },
    {
      id: "status",
      header: "Status",
      align: "center",
      cell: (r) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            r.status === "Paid"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {r.status}
        </span>
      ),
    },
  ];

  // Export
  const formatRows = () =>
    (report?.rows ?? []).map((r) => ({
      Farmer: typeof r.farmerId === "object" ? r.farmerId.name : "—",
      Liters: r.totalLiters.toFixed(2),
      MilkAmount: r.totalMilkAmount.toFixed(2),
      Deduction: r.totalDeduction.toFixed(2),
      Bonus: r.totalBonus.toFixed(2),
      NetPayable: r.netPayable.toFixed(2),
      Status: r.status,
    }));

  //Export Excel
  const exportExcel = () => {
    if (!report?.rows?.length) return toast.error("No billing records");

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formatRows());
    XLSX.utils.book_append_sheet(wb, ws, "Billing Report");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `Billing-Report-${month}.xlsx`);
  };

  //Export PDF
  const exportPDF = () => {
    if (!report?.rows?.length) return toast.error("No billing records");

    const doc = new jsPDF();
    doc.text(`Billing Report - ${month}`, 14, 10);

    autoTable(doc, {
      head: [
        ["Farmer", "Liters", "Milk", "Deduction", "Bonus", "Net", "Status"],
      ],
      body: report.rows.map((r) => [
        typeof r.farmerId === "object" ? r.farmerId.name : "—",
        r.totalLiters.toFixed(2),
        `₹ ${r.totalMilkAmount.toFixed(2)}`,
        `₹ ${r.totalDeduction.toFixed(2)}`,
        `₹ ${r.totalBonus.toFixed(2)}`,
        `₹ ${r.netPayable.toFixed(2)}`,
        r.status,
      ]),
      startY: 20,
    });

    doc.save(`Billing-Report-${month}.pdf`);
  };

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#5E503F]">
              Billing Report
            </h1>
            <p className="text-sm text-[#5E503F]/70">
              Monthly farmer billing summary
            </p>
          </div>

          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <ReportSwitcher />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Bills" value={report?.billCount ?? 0} />
          <StatCard
            title="Milk Amount"
            value={`₹ ${(report?.totalMilkAmount ?? 0).toFixed(2)}`}
          />
          <StatCard
            title="Deduction"
            value={`₹ ${(report?.totalDeduction ?? 0).toFixed(2)}`}
          />
          <StatCard
            title="Net Payable"
            value={`₹ ${(report?.netPayable ?? 0).toFixed(2)}`}
          />
        </div>
        {loading ? (
          <p className="text-sm text-[#5E503F]/60">Loading billing report…</p>
        ) : (
          <DataTable
            data={report?.rows ?? []}
            columns={columns}
            keyField="_id"
            striped
            dense
            emptyMessage="No bills for this month"
          />
        )}
        <div className="mt-0 flex justify-end gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-white text-xs"
          >
            <i className="fa-solid fa-file-excel"></i>
            Excel
          </button>

          <button
            onClick={exportPDF}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-white text-xs"
          >
            <i className="fa-solid fa-file-pdf"></i>
            PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingReportPage;
