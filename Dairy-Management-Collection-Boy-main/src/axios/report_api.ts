import { api } from "./axiosInstance";


export type DailyReportParams = {
  date: string; // "YYYY-MM-DD"
};

export type MonthlyReportParams = {
  month: string; // "YYYY-MM"
};

export type MilkEntry = {
  _id: string;
  farmerId: {
    _id: string;
    name: string;
    mobile: string;
  };
  date: string;
  session: "Morning" | "Evening";
  quantity: number;
  fat?: number;
  snf?: number;
  rate: number;
  totalAmount: number;
};

export type DailyReportResponse = {
  date: string;
  totalLiters: number;
  totalAmount: number;
  entries: MilkEntry[];
};

export type MonthlyReportResponse = {
  month: string;
  totalLiters: number;
  totalAmount: number;
  entries: MilkEntry[];
};


export const getDailyReport = (params: DailyReportParams) =>
  api.get<DailyReportResponse>("/reports/daily", { params });

export const getMonthlyReport = (params: MonthlyReportParams) =>
  api.get<MonthlyReportResponse>("/reports/monthly", { params });
