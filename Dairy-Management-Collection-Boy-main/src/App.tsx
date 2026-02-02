// src/App.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layout/mainLayout";

// Pages
import DashboardPage from "./pages/dashboard/dashboard";

import FarmerListPage from "./pages/farmers/farmerList";
import AddFarmerPage from "./pages/farmers/addFarmer";

import MilkEntryPage from "./pages/milkCollection/milkEntry";

import DeductionListPage from "./pages/deduction/deductionList";
import AddDeductionPage from "./pages/deduction/addDeduction";

import InventoryListPage from "./pages/inventory/inventoryList";
import AddInventoryPage from "./pages/inventory/addInventory";

import BonusManagementPage from "./pages/bonus/bonusManagement";
import RateChartPage from "./pages/rateChart/rateChart";
import DailyReportPage from "./pages/reports/dailyReport";
import MonthlyReportPage from "./pages/reports/monthlyReport";
import BillManagementPage from "./pages/bills/billManagement";

const App: React.FC = () => {
  return (
    <Routes>
      {/* Redirect root → dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<MainLayout />}>
        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Farmers */}
        <Route path="/farmers" element={<FarmerListPage />} />
        <Route path="/farmers/add" element={<AddFarmerPage />} />

        {/* Milk Collection (combined entry + list) */}
        <Route path="/milk-collection" element={<MilkEntryPage />} />

        {/* Deductions */}
        <Route path="/deduction" element={<DeductionListPage />} />
        <Route path="/deduction/add" element={<AddDeductionPage />} />

        {/* Inventory */}
        <Route path="/inventory" element={<InventoryListPage />} />
        <Route path="/inventory/add" element={<AddInventoryPage />} />

        {/* Bonus */}
        <Route path="/bonus" element={<BonusManagementPage />} />

        {/* Rate Chart */}
        <Route path="/rate-chart" element={<RateChartPage />} />

        {/* Reports */}
        <Route path="/reports/daily" element={<DailyReportPage />} />
        <Route
          path="/reports/monthly"
          element={<MonthlyReportPage />}
        />

        {/* Bills */}
        <Route path="/bills" element={<BillManagementPage />} />
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="flex h-screen items-center justify-center bg-[#F8F4E3]">
            <div className="rounded-xl border border-[#E9E2C8] bg-white px-8 py-6 text-center shadow">
              <h1 className="mb-2 text-2xl font-bold text-[#5E503F]">
                404 – Page not found
              </h1>
              <p className="mb-4 text-sm text-[#5E503F]/70">
                The page you are looking for doesn&apos;t exist.
              </p>
              <a
                href="/dashboard"
                className="rounded-md bg-[#2A9D8F] px-4 py-2 text-sm font-medium text-white hover:bg-[#247B71]"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

export default App;