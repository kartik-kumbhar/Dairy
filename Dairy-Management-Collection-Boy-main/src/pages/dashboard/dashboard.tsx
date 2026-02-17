// src/pages/dashboard/dashboard.tsx
import React, { useEffect, useState } from "react";
import {
  getTodayDashboardStats,
  getTopFarmers,
  getMonthlyDashboardStats,
} from "../../axios/dashboard_api";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/statCard";
import toast from "react-hot-toast";

type TodayStats = {
  totalLiters: number | null;
  cowLiters: number | null;
  buffaloLiters: number | null;
  mixLiters: number | null;
  farmersToday: number | null;
  amountToday: number | null;
};

type MonthStats = {
  totalLiters: number | null;
  amount: number | null;
  cowPercent: number | null;
  buffaloPercent: number | null;
  mixPercent: number | null;
};

type TopFarmer = {
  code: string;
  name: string;
  liters: number | null;
  amount: number | null;
};

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalLiters: 0,
    cowLiters: 0,
    buffaloLiters: 0,
    mixLiters: 0,
    farmersToday: 0,
    amountToday: 0,
  });

  const [monthStats, setMonthStats] = useState<MonthStats>({
    totalLiters: 0,
    amount: 0,
    cowPercent: 0,
    buffaloPercent: 0,
    mixPercent: 0,
  });

  const [topFarmers, setTopFarmers] = useState<TopFarmer[]>([]);

  const quickActions = [
    {
      label: "New Milk Entry",
      description: "Record today’s milk collection",
      onClick: () => navigate("/milk-collection"),
    },
    {
      label: "Add Farmer",
      description: "Register a new farmer",
      onClick: () => navigate("/farmers/add"),
    },
    {
      label: "Generate Bills",
      description: "Create farmer payment bills",
      onClick: () => navigate("/bills"),
    },
    {
      label: "View Daily Report",
      description: "Today’s collection summary",
      onClick: () => navigate("/reports/daily"),
    },
  ];

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [todayRes, monthRes, farmersRes] = await Promise.all([
          getTodayDashboardStats(),
          getMonthlyDashboardStats(),
          getTopFarmers(),
        ]);

        setTodayStats(todayRes.data || {});
        setMonthStats(monthRes.data || {});
        setTopFarmers(farmersRes.data ?? []);
      } catch (err) {
        console.error("Dashboard load failed:", err);

        toast.error("Failed to load dashboard data");
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="h-full w-full overflow-auto bg-[#F8F4E3] p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <header>
          <h1 className="text-2xl font-bold text-[#5E503F]">Dashboard</h1>
          <p className="text-sm text-[#5E503F]/70">
            Overview of collections, farmers, payments and inventory.
          </p>
        </header>

        {/* Stat Cards */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today's Collection"
            value={`${(todayStats.totalLiters ?? 0).toLocaleString()} L`}
            subtitle={`${todayStats.farmersToday ?? 0} farmers today`}
            variant="teal"
          />

          <StatCard
            title="Today's Amount"
            value={`₹ ${(todayStats.amountToday ?? 0).toLocaleString()}`}
            subtitle="Estimated payout"
            variant="blue"
          />

          <StatCard
            title="Monthly Collection"
            value={`${(monthStats.totalLiters ?? 0).toLocaleString()} L`}
            subtitle={`₹ ${(monthStats.amount ?? 0).toLocaleString()}`}
            variant="orange"
          />

          <StatCard
            title="Milk Type Ratio"
            value={`${monthStats.cowPercent ?? 0}% Cow / ${
              monthStats.buffaloPercent ?? 0
            }% Buffalo / ${monthStats.mixPercent ?? 0}% Mix`}
            subtitle="Share of monthly liters"
            variant="green"
          />
        </section>

        {/* Breakdown */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl bg-white p-5">
            <h2 className="text-sm font-semibold text-[#5E503F]">
              Today's Milk Breakdown
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {/* Cow */}
              <div className="flex items-center justify-between rounded-lg bg-[#F8F4E3] p-4">
                <p className="text-2xl font-bold">
                  {(todayStats.cowLiters ?? 0).toLocaleString()}
                </p>
                <span className="text-3xl">🐄</span>
              </div>

              {/* Buffalo */}
              <div className="flex items-center justify-between rounded-lg bg-[#F8F4E3] p-4">
                <p className="text-2xl font-bold">
                  {(todayStats.buffaloLiters ?? 0).toLocaleString()} L
                </p>
                <span className="text-3xl">🐃</span>
              </div>

              {/* Mix */}
              <div className="flex items-center justify-between rounded-lg bg-[#F8F4E3] p-4">
                <p className="text-2xl font-bold">
                  {(todayStats.mixLiters ?? 0).toLocaleString()} L
                </p>
                <span className="text-3xl">🥛</span>
              </div>
            </div>
          </div>

          {/* Top Farmers */}
          <div className="rounded-xl bg-white p-5">
            <h2 className="text-sm font-semibold text-[#5E503F]">
              Top Farmers (This Month)
            </h2>

            <div className="mt-4 space-y-3">
              {topFarmers.map((f, index) => (
                <div
                  key={index++}
                  className="flex justify-between rounded-lg bg-[#F8F4E3] px-3 py-2"
                >
                  <div>
                    <p className="font-semibold">{f.name}</p>
                    <p className="text-xs">Code: {f.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs">
                      {(f.liters ?? 0).toLocaleString()} L
                    </p>
                    <p className="font-semibold text-[#2A9D8F]">
                      ₹{(f.amount ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-xl bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                className="rounded-lg bg-[#F8F4E3] p-3 text-left"
              >
                <p className="font-semibold text-[#2A9D8F]">{a.label}</p>
                <p className="text-xs">{a.description}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
