// src/pages/bills/billManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import InputField from "../../components/inputField";
import SelectField from "../../components/selectField";
import DataTable, { type DataTableColumn } from "../../components/dataTable";
import StatCard from "../../components/statCard";
import ConfirmModal from "../../components/confirmModal";
import Loader from "../../components/loader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Farmer } from "../../types/farmer";
import type { Bill, BillStatus } from "../../types/bills";

import { getFarmers } from "../../axios/farmer_api";
import { generateBill, getBills } from "../../axios/bill_api";
import { api } from "../../axios/axiosInstance";
import toast from "react-hot-toast";

type BillScope = "All" | "Single";

interface CalculatedBillRow {
  farmerId: string;
  farmerCode: string;
  farmerName: string;
  liters: number;
  milkAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  netAmount: number;
}

const BillManagementPage: React.FC = () => {
  const today = new Date();

  const todayISO = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const firstOfMonthISO = `${today.getFullYear()}-${String(
    today.getMonth() + 1,
  ).padStart(2, "0")}-01`;

  // Backend data
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [existingBills, setExistingBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [loadingFarmers, setLoadingFarmers] = useState(false);

  // Generate section state
  const [scope, setScope] = useState<BillScope>("All");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [periodFrom] = useState<string>(firstOfMonthISO);
  const [periodTo, setPeriodTo] = useState<string>(todayISO);

  const [calculating, setCalculating] = useState(false);
  const [calculatedRows, setCalculatedRows] = useState<CalculatedBillRow[]>([]);
  const [calculatedTotalNet, setCalculatedTotalNet] = useState<number>(0);
  const [savingBills, setSavingBills] = useState(false);

  // Filters
  const [billStatusFilter, setBillStatusFilter] = useState<"All" | BillStatus>(
    "All",
  );
  const [billSearch, setBillSearch] = useState("");

  // Delete confirm (backend delete not implemented in your routes)
  const [deleteBillTarget, setDeleteBillTarget] = useState<Bill | null>(null);

  const selectedFarmer = useMemo(
    () => farmers.find((f) => f._id === selectedFarmerId),
    [farmers, selectedFarmerId],
  );

  // ---------- LOAD FROM BACKEND ----------
  const loadFarmers = async () => {
    try {
      setLoadingFarmers(true);
      const res = await getFarmers();
      setFarmers(res.data);
    } catch (err) {
      console.error("Error loading farmers:", err);
    } finally {
      setLoadingFarmers(false);
    }
  };

  const loadBills = async () => {
    try {
      setLoadingBills(true);
      const res = await getBills();
      // newest first
      const sorted = [...res.data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setExistingBills(sorted);
    } catch (err) {
      console.error("Error loading bills:", err);
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    loadFarmers();
    loadBills();
  }, []);

  // ---------- STATS ----------
  const billStats = useMemo(() => {
    const totalBills = existingBills.length;
    const pending = existingBills.filter((b) => b.status === "Pending").length;
    const paid = existingBills.filter((b) => b.status === "Paid").length;
    const totalAmount = existingBills.reduce((sum, b) => sum + b.netAmount, 0);

    return { totalBills, pending, paid, totalAmount };
  }, [existingBills]);

  // ---------- FILTER ----------
  const filteredBills = useMemo(() => {
    return existingBills.filter((b) => {
      const matchesStatus =
        billStatusFilter === "All" ? true : b.status === billStatusFilter;

      const term = billSearch.trim().toLowerCase();
      const matchesSearch =
        term.length === 0 ||
        b.billNo.toLowerCase().includes(term) ||
        b.farmerName.toLowerCase().includes(term) ||
        b.farmerCode.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [existingBills, billStatusFilter, billSearch]);

  // ---------- GENERATE BILL(S) USING BACKEND ----------
  const calculateBills = async () => {
    if (!periodFrom || !periodTo) {
      toast.error("Please select bill period (From and To).");
      return;
    }

    if (periodFrom > periodTo) {
      toast.error("Period From cannot be after Period To.");
      return;
    }

    if (scope === "Single" && !selectedFarmerId) {
      toast.error("Please select a farmer for single farmer bill.");
      return;
    }

    try {
      setCalculating(true);

      const rows: CalculatedBillRow[] = [];

      const farmersToProcess =
        scope === "Single" && selectedFarmer ? [selectedFarmer] : farmers;
      const normalizedPeriodFrom = periodFrom.slice(0, 7) + "-01";

      for (const f of farmersToProcess) {
        const res = await api.post("/bills/preview", {
          farmerId: f._id,
          periodFrom: normalizedPeriodFrom,
          periodTo,
        });

        if (res.data.totalLiters === 0 && res.data.netAmount === 0) {
          continue;
        }

        rows.push({
          farmerId: f._id,
          farmerCode: f.code,
          farmerName: f.name,
          liters: res.data.totalLiters,
          milkAmount: res.data.milkAmount,
          bonusAmount: res.data.bonusAmount,
          deductionAmount: res.data.deductionAmount,
          netAmount: res.data.netAmount,
        });
      }

      setCalculatedRows(rows);
      setCalculatedTotalNet(rows.reduce((sum, r) => sum + r.netAmount, 0));
    } catch (err) {
      console.error("Calculate bills failed:", err);
      toast.error("Failed to calculate bills.");
    } finally {
      setCalculating(false);
    }
  };

  // ---------- DELETE ----------

  const generateBills = async () => {
    if (!periodFrom || !periodTo) {
      toast.error("Please select bill period.");
      return;
    }

    try {
      setSavingBills(true);

      const farmersToProcess =
        scope === "Single" && selectedFarmer ? [selectedFarmer] : farmers;

      let success = 0;
      // let skipped = 0;
      const normalizedPeriodFrom = periodFrom.slice(0, 7) + "-01";

      for (const f of farmersToProcess) {
        try {
          await generateBill({
            farmerId: f._id,
            periodFrom: normalizedPeriodFrom,
            periodTo,
          });
          success++;
        } catch (err: unknown) {
          if (axios.isAxiosError(err) && err.response?.status === 409) {
            // skipped++; // bill already exists
          } else {
            throw err; // real error
          }
        }
      }

      toast.success(`Bills generated: ${success}`); //\nAlready existed: ${skipped}

      await loadBills();
      setCalculatedRows([]);
    } catch (err) {
      console.error("Generate bills error:", err);
      toast.error("Something went wrong while generating bills.");
    } finally {
      setSavingBills(false);
    }
  };

  const deleteBill = async () => {
    if (!deleteBillTarget) return;

    try {
      await api.delete(`/bills/${deleteBillTarget._id}`);
      toast.success("Bill deleted successfully");
      setDeleteBillTarget(null);
      await loadBills(); // 🔄 refresh table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error("Failed to delete bill");
      }
    }
  };

  const markAsPaid = async (bill: Bill) => {
    try {
      await api.put(`/bills/${bill._id}/pay`);
      toast.success("Bill marked as Paid");

      await loadBills(); //  refresh table + stats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to mark bill as Paid");
    }
  };

  // ---------- TABLES ----------
  const previewColumns: DataTableColumn<CalculatedBillRow>[] = [
    {
      id: "farmerCode",
      header: "Code",
      accessor: "farmerCode",
      align: "center",
    },
    {
      id: "farmerName",
      header: "Farmer Name",
      accessor: "farmerName",
      align: "center",
    },
    {
      id: "liters",
      header: "Liters",
      align: "center",
      cell: (row) => (row.liters ?? 0).toFixed(2),
    },
    {
      id: "milkAmount",
      header: "Milk Amount",
      align: "center",
      cell: (row) => `₹ ${(row.milkAmount ?? 0).toFixed(2)}`,
    },
    {
      id: "bonusAmount",
      header: "Bonus",
      align: "center",
      cell: (row) => `₹ ${(row.bonusAmount ?? 0).toFixed(2)}`,
    },
    {
      id: "deductionAmount",
      header: "Deductions",
      align: "center",
      cell: (row) => `₹ ${(row.deductionAmount ?? 0).toFixed(2)}`,
    },
    {
      id: "",
      header: "Net Payable",
      align: "center",
      cell: (row) => `₹ ${(row.netAmount ?? 0).toFixed(2)}`,
    },
  ];

  const billColumns: DataTableColumn<Bill>[] = [
    { id: "billNo", header: "Bill No", accessor: "billNo", align: "center" },
    {
      id: "farmer",
      header: "Farmer",
      align: "center",
      cell: (row) => (
        <div className="min-w-[140px]">
          <div className="text-[#5E503F] text-sm">{row.farmerName}</div>
          <div className="text-[11px] text-[#5E503F]/60">{row.farmerCode}</div>
        </div>
      ),
    },
    {
      id: "period",
      header: "Period",
      align: "center",
      cell: (row) => (
        <span className="text-xs text-[#5E503F] whitespace-nowrap">
          {row.periodFrom} → {row.periodTo}
        </span>
      ),
    },
    {
      id: "liters",
      header: "Liters",
      align: "center",
      cell: (row) => row.totalLiters.toFixed(2),
    },
    {
      id: "amount",
      header: "Milk Amount",
      align: "center",
      cell: (row) => `₹ ${row.milkAmount.toFixed(2)}`,
    },
    {
      id: "bonus",
      header: "Bonus",
      align: "center",
      cell: (row) => `₹ ${row.bonusAmount.toFixed(2)}`,
    },
    {
      id: "deduction",
      header: "Deduction",
      align: "center",
      cell: (row) => `₹ ${row.deductionAmount.toFixed(2)}`,
    },
    {
      id: "net",
      header: "Net Payable",
      align: "center",
      cell: (row) => `₹ ${row.netAmount.toFixed(2)}`,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
            row.status === "Paid"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "center",
      cell: (row) => (
        <div className="flex items-center justify-center gap-2">
          {/* MARK AS PAID */}
          <button
            type="button"
            disabled={row.status === "Paid"}
            onClick={() => markAsPaid(row)}
            className={`rounded-md px-2 py-1 text-xs ${
              row.status === "Paid"
                ? "cursor-not-allowed bg-green-100 text-green-600"
                : "border border-[#2A9D8F] text-[#2A9D8F] hover:bg-[#2A9D8F]/10"
            }`}
          >
            Paid
          </button>

          {/* DELETE */}
          <button
            type="button"
            disabled={row.status === "Paid"}
            onClick={() => setDeleteBillTarget(row)}
            className={`rounded-md px-2 py-1 text-xs ${
              row.status === "Paid"
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "border border-[#E9E2C8] bg-white text-[#E76F51] hover:bg-[#E76F51]/10"
            }`}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const farmerOptions = farmers.map((f) => ({
    label: `${f.code} - ${f.name}`,
    value: f._id,
  }));

  // Export PDF
  const exportSingleBillPDF = () => {
    if (scope !== "Single" || calculatedRows.length !== 1) {
      toast.error("PDF available only for single farmer bill.");
      return;
    }

    const row = calculatedRows[0];
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Milk Bill", 14, 15);

    doc.setFontSize(11);
    doc.text(`Farmer: ${row.farmerName}`, 14, 25);
    doc.text(`Code: ${row.farmerCode}`, 14, 32);
    doc.text(`Period: ${periodFrom} to ${periodTo}`, 14, 39);

    autoTable(doc, {
      startY: 50,
      head: [["Description", "Amount (₹)"]],
      body: [
        ["Total Liters", row.liters.toFixed(2)],
        ["Milk Amount", row.milkAmount.toFixed(2)],
        ["Bonus", row.bonusAmount.toFixed(2)],
        ["Deduction", row.deductionAmount.toFixed(2)],
        ["Net Payable", row.netAmount.toFixed(2)],
      ],
    });

    doc.save(`Bill-${row.farmerCode}-${periodFrom.slice(0, 7)}.pdf`);

    toast.success("PDF generated successfully");
  };

  // WhatsApp
  const sendBillViaWhatsApp = () => {
    if (scope !== "Single" || calculatedRows.length !== 1) {
      toast.error("WhatsApp available only for single farmer bill.");
      return;
    }

    if (!selectedFarmer?.mobile) {
      toast.error("Farmer mobile number not found.");
      return;
    }

    const row = calculatedRows[0];

    const message = `
🧾 *Milk Bill*

👤 Farmer: ${row.farmerName}
🆔 Code: ${row.farmerCode}
📅 Period: ${periodFrom} to ${periodTo}

🥛 Total Liters: ${row.liters.toFixed(2)}
💰 Milk Amount: ₹ ${row.milkAmount.toFixed(2)}
🎁 Bonus: ₹ ${row.bonusAmount.toFixed(2)}
➖ Deduction: ₹ ${row.deductionAmount.toFixed(2)}

✅ *Net Payable: ₹ ${row.netAmount.toFixed(2)}*

Thank you.
`;

    const phone = selectedFarmer.mobile.replace(/\D/g, "");
    const whatsappURL = `https://wa.me/91${phone}?text=${encodeURIComponent(
      message,
    )}`;

    window.open(whatsappURL, "_blank");
  };

  return (
    <div className="w-full min-w-0 bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#5E503F]">
              Bill Management
            </h1>
            <p className="text-sm text-[#5E503F]/70">
              Generate and manage farmer payment bills.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Bills"
            value={billStats.totalBills}
            variant="teal"
          />
          <StatCard
            title="Pending Bills"
            value={billStats.pending}
            variant="orange"
          />
          <StatCard title="Paid Bills" value={billStats.paid} variant="green" />
          <StatCard
            title="Total Billed (₹)"
            value={billStats.totalAmount.toFixed(2)}
            variant="blue"
          />
        </div>

        {/* Generate Bills */}
        <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#5E503F]">
              Generate Bills
            </h2>
            <span className="text-xs text-[#5E503F]/60">
              Select bill scope, period and calculate payable amounts.
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-xs font-medium text-[#5E503F]">
                Bill Scope
              </div>
              <div className="mt-1 flex gap-2">
                {(["All", "Single"] as BillScope[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                      scope === s
                        ? "bg-[#2A9D8F] text-white"
                        : "bg-[#E9E2C8] text-[#5E503F]"
                    }`}
                  >
                    {s === "All" ? "All Farmers" : "Single Farmer"}
                  </button>
                ))}
              </div>
            </div>

            <InputField
              label="Period From"
              type="date"
              value={periodFrom}
              disabled
            />

            <InputField
              label="Period To"
              type="date"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
              requiredLabel
            />

            {scope === "Single" && (
              <SelectField
                label="Select Farmer"
                requiredLabel
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                options={[
                  { label: "Select farmer", value: "" },
                  ...farmerOptions,
                ]}
              />
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-xs text-[#5E503F]/60">
              Preview is basic. Actual bill calculation is done by backend.
            </div>

            <button
              type="button"
              onClick={calculateBills}
              disabled={calculating || loadingFarmers}
              className="rounded-md bg-[#2A9D8F] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#247B71] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {calculating ? "Calculating..." : "Calculate Bills"}
            </button>
          </div>

          <div className="mt-6">
            {calculating ? (
              <div className="flex items-center justify-center py-8">
                <Loader size="md" message="Calculating bills..." />
              </div>
            ) : calculatedRows.length === 0 ? (
              <div className="py-8 text-center text-sm text-[#5E503F]/60">
                No bill data calculated yet.
              </div>
            ) : (
              <>
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[900px]">
                    <DataTable
                      data={calculatedRows}
                      columns={previewColumns}
                      keyField="farmerId"
                      striped
                      dense
                    />
                  </div>
                </div>

                {/* ////////////////////////////////////////// */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs text-[#5E503F]/60">
                    Bills to generate: {calculatedRows.length}
                  </div>

                  <div className="text-sm font-semibold text-[#5E503F]">
                    Total Net Payable:{" "}
                    <span className="text-[#2A9D8F]">
                      ₹ {calculatedTotalNet.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-3 flex-wrap">
                  {/* WHATSAPP BUTTON */}
                  {scope === "Single" && calculatedRows.length === 1 && (
                    <button
                      type="button"
                      onClick={sendBillViaWhatsApp}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-md bg-green-600 px-3 py-2 text-white text-xs"
                    >
                      <i className="fa-brands fa-whatsapp"></i> WhatsApp
                    </button>
                  )}
                  {/* PDF BUTTON — ONLY FOR SINGLE FARMER */}
                  {scope === "Single" && calculatedRows.length === 1 && (
                    <button
                      type="button"
                      onClick={exportSingleBillPDF}
                      className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-white text-xs"
                    >
                      <i className="fa-solid fa-file-pdf"></i> PDF
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCalculatedRows([])}
                    className="rounded-md border border-[#E9E2C8] bg-white px-4 py-2 text-sm text-[#5E503F] hover:bg-[#F8F4E3]"
                  >
                    Clear Preview
                  </button>

                  <button
                    type="button"
                    onClick={generateBills}
                    disabled={savingBills}
                    className="rounded-md bg-[#2A9D8F] px-5 py-2 text-sm font-medium text-white shadow hover:bg-[#247B71] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {savingBills ? "Generating..." : "Generate Bills"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Existing Bills */}
        <div className="rounded-xl border border-[#E9E2C8] bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#5E503F]">
              Existing Bills
            </h2>
          </div>

          <div className="mb-4 flex flex-wrap items-end gap-3">
            <SelectField
              label="Status"
              value={billStatusFilter}
              onChange={(e) =>
                setBillStatusFilter(
                  e.target.value === "All"
                    ? "All"
                    : (e.target.value as BillStatus),
                )
              }
              options={[
                { label: "All", value: "All" },
                { label: "Pending", value: "Pending" },
                { label: "Paid", value: "Paid" },
              ]}
              containerClassName="w-40"
            />

            <div className="w-full sm:ml-auto sm:min-w-[220px] sm:flex-1">
              <InputField
                label="Search"
                placeholder="Bill no / farmer / code"
                value={billSearch}
                onChange={(e) => setBillSearch(e.target.value)}
              />
            </div>

            <button
              type="button"
              onClick={loadBills}
              className="rounded-md border border-[#E9E2C8] bg-white px-4 py-2 text-sm text-[#5E503F] hover:bg-[#F8F4E3]"
            >
              Refresh
            </button>
          </div>

          {loadingBills ? (
            <div className="flex items-center justify-center py-8">
              <Loader size="md" message="Loading bills..." />
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[1000px]">
                <DataTable
                  data={filteredBills}
                  columns={billColumns}
                  keyField="_id"
                  striped
                  dense
                  emptyMessage="No bills found."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={!!deleteBillTarget}
        title="Delete Bill"
        variant="danger"
        description={
          deleteBillTarget && (
            <div className="space-y-1 text-sm">
              <p>Are you sure you want to delete this bill?</p>
              <p className="text-xs text-[#5E503F]/70">
                {deleteBillTarget.billNo} – {deleteBillTarget.farmerCode} (
                {deleteBillTarget.farmerName}) – Period:{" "}
                {deleteBillTarget.periodFrom} → {deleteBillTarget.periodTo}
              </p>
            </div>
          )
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={deleteBill}
        onCancel={() => setDeleteBillTarget(null)}
      />
    </div>
  );
};

export default BillManagementPage;
