// src/pages/farmers/farmerList.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { MilkType, FarmerStatus } from "../../types/farmer";
import type { Farmer } from "../../types/farmer";

import InputField from "../../components/inputField";
import StatCard from "../../components/statCard";
import ConfirmModal from "../../components/confirmModal";

import { ROUTES } from "../../constants/routes";
import { useFarmerContext } from "../../context/FarmerContext";

const FarmerListPage: React.FC = () => {
  const navigate = useNavigate();
  const { farmers: allFarmers, reloadFarmers } = useFarmerContext();

  const [milkFilter, setMilkFilter] = useState<"All" | MilkType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | FarmerStatus>("All");
  const [search, setSearch] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<Farmer | null>(null);

  useEffect(() => {
    reloadFarmers();
  }, [reloadFarmers]);

  // ---- Stats ----
  const stats = useMemo(() => {
    const total = allFarmers.length;
    const cow = allFarmers.filter((f) => f.milkType === "cow").length;
    const buffalo = allFarmers.filter((f) => f.milkType === "buffalo").length;
    const active = allFarmers.filter((f) => f.status === "Active").length;
    const inactive = total - active;
    return { total, cow, buffalo, active, inactive };
  }, [allFarmers]);

  // ---- Filtered list ----
  const filteredFarmers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allFarmers.filter((f) => {
      const matchesMilk =
        milkFilter === "All" ? true : f.milkType === milkFilter;
      const matchesStatus =
        statusFilter === "All" ? true : f.status === statusFilter;
      const matchesSearch =
        term.length === 0 ||
        f.name.toLowerCase().includes(term) ||
        f.code.toLowerCase().includes(term) ||
        f.mobile.includes(term);
      return matchesMilk && matchesStatus && matchesSearch;
    });
  }, [allFarmers, milkFilter, statusFilter, search]);

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#5E503F]">
              Farmer Management
            </h1>
            <p className="text-sm text-[#5E503F]/70">
              View, filter, edit and manage all farmers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(ROUTES.farmers.add.path)}
            className="rounded-md bg-[#2A9D8F] px-4 py-2 text-sm font-medium text-white shadow hover:bg-[#247B71]"
          >
            + Add Farmer
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Farmers" value={stats.total} variant="teal" />
          <StatCard title="Cow Milk" value={stats.cow} variant="red" />
          <StatCard title="Buffalo Milk" value={stats.buffalo} variant="blue" />
          <StatCard title="Active" value={stats.active} variant="green" />
          <StatCard title="Inactive" value={stats.inactive} variant="orange" />
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-[#E9E2C8] bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {/* Milk type filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#5E503F]">
                Milk Type:
              </span>
              <button
                type="button"
                onClick={() => setMilkFilter("All")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  milkFilter === "All"
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setMilkFilter("cow")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  milkFilter === "cow"
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                Cow
              </button>
              <button
                type="button"
                onClick={() => setMilkFilter("buffalo")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  milkFilter === "buffalo"
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                Buffalo
              </button>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#5E503F]">
                Status:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter("All")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  statusFilter === "All"
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Active")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  statusFilter === "Active"
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("Inactive")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  statusFilter === "Inactive"
                    ? "bg-[#2A9D8F] text-white"
                    : "bg-[#E9E2C8] text-[#5E503F]"
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Search */}
            <div className="ml-auto min-w-[220px] flex-1">
              <InputField
                label="Search"
                placeholder="Name / code / mobile"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table – simple and perfectly aligned */}
        <div className="overflow-hidden rounded-xl border border-[#E9E2C8] bg-white shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[#F8F4E3]">
              <tr>
                <th className="border-b border-[#E9E2C8] px-4 py-2 text-left text-xs font-semibold text-[#5E503F]">
                  Code
                </th>
                <th className="border-b border-[#E9E2C8] px-4 py-2 text-left text-xs font-semibold text-[#5E503F]">
                  Name
                </th>
                <th className="border-b border-[#E9E2C8] px-4 py-2 text-left text-xs font-semibold text-[#5E503F]">
                  Mobile
                </th>
                <th className="border-b border-[#E9E2C8] px-4 py-2 text-left text-xs font-semibold text-[#5E503F]">
                  Milk Type
                </th>
                <th className="border-b border-[#E9E2C8] px-4 py-2 text-left text-xs font-semibold text-[#5E503F]">
                  Status
                </th>
                <th className="border-b border-[#E9E2C8] px-4 py-2 text-left text-xs font-semibold text-[#5E503F]">
                  Join Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-xs text-[#5E503F]/60"
                  >
                    No farmers found. Click &quot;Add Farmer&quot; to create
                    one.
                  </td>
                </tr>
              ) : (
                filteredFarmers.map((f, index) => (
                  <tr
                    key={f._id}
                    className={index % 2 === 0 ? "bg-white" : "bg-[#FDFCF8]"}
                  >
                    <td className="border-t border-[#E9E2C8] px-4 py-2">
                      <span className="inline-flex items-center rounded-full bg-[#2A9D8F]/10 px-3 py-1 text-xs font-semibold text-[#2A9D8F]">
                        {f.code}
                      </span>
                    </td>
                    <td className="border-t border-[#E9E2C8] px-4 py-2 text-[#5E503F]">
                      {f.name}
                    </td>
                    <td className="border-t border-[#E9E2C8] px-4 py-2 text-[#5E503F]">
                      {f.mobile}
                    </td>
                    <td className="border-t border-[#E9E2C8] px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          f.milkType === "cow"
                            ? "bg-[#E76F51]/10 text-[#E76F51]"
                            : "bg-[#457B9D]/10 text-[#457B9D]"
                        }`}
                      >
                        {f.milkType === "cow" ? "🐄" : "🐃"} {f.milkType}
                      </span>
                    </td>
                    <td className="border-t border-[#E9E2C8] px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                          f.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="border-t border-[#E9E2C8] px-4 py-2 text-[#5E503F]">
                      {f.joinDate}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm – hooked up later when you implement delete */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Farmer"
        variant="danger"
        description={
          deleteTarget && (
            <div className="space-y-1 text-sm">
              <p>Are you sure you want to delete this farmer?</p>
              <p className="text-xs text-[#5E503F]/70">
                {deleteTarget.code} – {deleteTarget.name}
              </p>
            </div>
          )
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FarmerListPage;
