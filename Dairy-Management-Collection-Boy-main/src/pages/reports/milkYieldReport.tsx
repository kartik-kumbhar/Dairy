/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/statCard";
import InputField from "../../components/inputField";
import ReportSwitcher from "../../components/ReportSwitcher";
import { getMilkYieldReport } from "../../axios/report_api";

type Mode = "daily" | "monthly";

const MilkYieldReportPage: React.FC = () => {
  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);

  const [mode, setMode] = useState<Mode>("daily");
  const [date, setDate] = useState(today);
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState<{ cow: any; buffalo: any } | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="h-full w-full bg-[#F8F4E3] p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#5E503F]">
              Milk Yield Report
            </h1>
            <p className="text-sm text-[#5E503F]/70">
              Cow vs Buffalo milk yield
            </p>
          </div>

          {mode === "daily" ? (
            <div className="w-44">
              <InputField
                label="Select Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          ) : (
            <div className="w-44">
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
        <div className="flex gap-2">
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
          <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
    </div>
  );
};

export default MilkYieldReportPage;
