import { api } from "./axiosInstance";
import type { MilkRateChart } from "../types/rateChart";

export const getRateCharts = () =>
  api.get<{ cow: MilkRateChart; buffalo: MilkRateChart }>("/rate-chart");

export const updateRateChart = (
  milkType: "cow" | "buffalo",
  data: MilkRateChart,
) => api.put<MilkRateChart>(`/rate-chart/${milkType}`, data);

export const getRateForMilk = (params: {
  milkType: "cow" | "buffalo";
  fat: number;
  snf: number;
  date: string;
}) => api.get<{ rate: number }>("/rate-chart/rate", { params });
