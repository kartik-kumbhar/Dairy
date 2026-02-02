// src/pages/bills/billManagement.tsx
import React, { useEffect, useMemo, useState } from "react";
  import axios from "axios";

import InputField from "../../components/inputField";
import SelectField from "../../components/selectField";
import DataTable, { type DataTableColumn } from "../../components/dataTable";
import StatCard from "../../components/statCard";
import ConfirmModal from "../../components/confirmModal";
import Loader from "../../components/loader";

import type { Farmer } from "../../types/farmer";
import type { Bill, BillStatus } from "../../types/bills";

import { getFarmers } from "../../axios/farmer_api";
import { generateBill, getBills } from "../../axios/bill_api";
import { api } from "../../axios/axiosInstance";

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
  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => today.toISOString().slice(0, 10), [today]);
  const firstOfMonthISO = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    return d.toISOString().slice(0, 10);
  }, [today]);

  // Backend data
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [existingBills, setExistingBills] = useState<Bill[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [loadingFarmers, setLoadingFarmers] = useState(false);

  // Generate section state
  const [scope, setScope] = useState<BillScope>("All");
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [periodFrom, setPeriodFrom] = useState<string>(firstOfMonthISO);
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
      alert("Please select bill period (From and To).");
      return;
    }

    if (periodFrom > periodTo) {
      alert("Period From cannot be after Period To.");
      return;
    }

    if (scope === "Single" && !selectedFarmerId) {
      alert("Please select a farmer for single farmer bill.");
      return;
    }

    try {
      setCalculating(true);

      const rows: CalculatedBillRow[] = [];

      const farmersToProcess =
        scope === "Single" && selectedFarmer ? [selectedFarmer] : farmers;

      for (const f of farmersToProcess) {
        const res = await api.post("/bills/preview", {
          farmerId: f._id,
          periodFrom,
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
      alert("Failed to calculate bills.");
    } finally {
      setCalculating(false);
    }
  };


  // ---------- DELETE ----------

const generateBills = async () => {
  if (!periodFrom || !periodTo) {
    alert("Please select bill period.");
    return;
  }

  try {
    setSavingBills(true);

    const farmersToProcess =
      scope === "Single" && selectedFarmer
        ? [selectedFarmer]
        : farmers;

    let success = 0;
    let skipped = 0;

    for (const f of farmersToProcess) {
      try {
        await generateBill({
          farmerId: f._id,
          periodFrom,
          periodTo,
        });
        success++;
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          skipped++; // bill already exists
        } else {
          throw err; // real error
        }
      }
    }

    alert(
      `Bills generated: ${success}\nAlready existed: ${skipped}`
    );

    await loadBills();
    setCalculatedRows([]);
  } catch (err) {
    console.error("Generate bills error:", err);
    alert("Something went wrong while generating bills.");
  } finally {
    setSavingBills(false);
  }
};

  
  const deleteBill = () => {
    alert("Backend delete bill API not added yet.");
    setDeleteBillTarget(null);
  };

  // ---------- TABLES ----------
  const previewColumns: DataTableColumn<CalculatedBillRow>[] = [
    { id: "farmerCode", header: "Code", accessor: "farmerCode" },
    { id: "farmerName", header: "Farmer Name", accessor: "farmerName" },
    {
      id: "liters",
      header: "Liters",
      align: "right",
      // cell: (row) => `₹ ${(row.liters ?? 0).toFixed(2)}`
      cell: (row) => (row.liters ?? 0).toFixed(2),
    },
    {
      id: "milkAmount",
      header: "Milk Amount",
      align: "right",
      cell: (row) => `₹ ${(row.milkAmount ?? 0).toFixed(2)}`,
    },
    {
      id: "bonusAmount",
      header: "Bonus",
      align: "right",
      cell: (row) => `₹ ${(row.bonusAmount ?? 0).toFixed(2)}`,
    },
    {
      id: "deductionAmount",
      header: "Deductions",
      align: "right",
      cell: (row) => `₹ ${(row.deductionAmount ?? 0).toFixed(2)}`,
    },
    {
      id: "",
      header: "Net Payable",
      align: "right",
      cell: (row) => `₹ ${(row.netAmount ?? 0).toFixed(2)}`,
    },
  ];

  const billColumns: DataTableColumn<Bill>[] = [
    { id: "billNo", header: "Bill No", accessor: "billNo" },
    {
      id: "farmer",
      header: "Farmer",
      cell: (row) => (
        <div>
          <div className="text-[#5E503F] text-sm">{row.farmerName}</div>
          <div className="text-[11px] text-[#5E503F]/60">{row.farmerCode}</div>
        </div>
      ),
    },
    {
      id: "period",
      header: "Period",
      cell: (row) => (
        <span className="whitespace-nowrap text-xs text-[#5E503F]">
          {row.periodFrom} → {row.periodTo}
        </span>
      ),
    },
    {
      id: "liters",
      header: "Liters",
      align: "right",
      cell: (row) => row.totalLiters.toFixed(2),
    },
    {
      id: "amount",
      header: "Milk Amount",
      align: "right",
      cell: (row) => `₹ ${row.milkAmount.toFixed(2)}`,
    },
    {
      id: "bonus",
      header: "Bonus",
      align: "right",
      cell: (row) => `₹ ${row.bonusAmount.toFixed(2)}`,
    },
    {
      id: "deduction",
      header: "Deduction",
      align: "right",
      cell: (row) => `₹ ${row.deductionAmount.toFixed(2)}`,
    },
    {
      id: "net",
      header: "Net Payable",
      align: "right",
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
        <button
          type="button"
          onClick={() => setDeleteBillTarget(row)}
          className="rounded-md border border-[#E9E2C8] bg-white px-2 py-1 text-[#E76F51] hover:bg-[#E76F51]/10"
        >
          Delete
        </button>
      ),
    },
  ];

  const farmerOptions = farmers.map((f) => ({
    label: `${f.code} - ${f.name}`,
    value: f._id,
  }));

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#5E503F]">
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
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
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
              onChange={(e) => setPeriodFrom(e.target.value)}
              requiredLabel
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

          <div className="mt-4 flex items-center justify-between gap-3">
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
              <div className="rounded-lg border border-dashed border-[#E9E2C8] bg-[#F8F4E3] py-8 text-center text-sm text-[#5E503F]/60">
                No bill data calculated yet.
              </div>
            ) : (
              <>
                <DataTable
                  data={calculatedRows}
                  columns={previewColumns}
                  keyField="farmerId"
                  striped
                  dense
                />
                {/* ////////////////////////////////////////// */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs text-[#5E503F]/70">
                    Bills to generate: {calculatedRows.length}
                  </div>

                  <div className="text-sm font-semibold text-[#5E503F]">
                    Total Net Payable:{" "}
                    <span className="text-[#2A9D8F]">
                      ₹ {calculatedTotalNet.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-3">
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

          <div className="mb-4 flex flex-wrap items-center gap-4">
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

            <div className="ml-auto min-w-[220px] flex-1">
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
            <DataTable
              data={filteredBills}
              columns={billColumns}
              keyField="_id"
              striped
              dense
              emptyMessage="No bills found."
            />
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
