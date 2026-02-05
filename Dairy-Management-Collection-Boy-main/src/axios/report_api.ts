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
  shift: "Morning" | "Evening";
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
  cowLiters: number;
  buffaloLiters: number;
  entries: MilkEntry[];
};

export type MonthlyReportResponse = {
  month: string;
  totalLiters: number;
  totalAmount: number;
  entries: MilkEntry[];
};
export type MilkYieldReportResponse = {
  cow: {
    liters: number;
    amount: number;
  };
  buffalo: {
    liters: number;
    amount: number;
  };
};
export type MilkYieldParams = {
  from: string;
  to: string;
};

export type MilkYieldItem = {
  _id: "cow" | "buffalo";
  liters: number;
  amount: number;
};
export type MilkYieldResponse = {
  cow: {
    liters: number;
    amount: number;
  };
  buffalo: {
    liters: number;
    amount: number;
  };
};

export const getMilkYieldReport = (params: { from: string; to: string }) =>
  api.get<MilkYieldResponse>("/reports/milk-type", { params });

export const getDailyReport = (date: string) =>
  api.get<DailyReportResponse>("/reports/daily-milk", {
    params: { date },
  });

export const getMonthlyReport = (params: MonthlyReportParams) =>
  api.get<MonthlyReportResponse>("/reports/monthly", { params });

export type MonthlyMilkReportResponse = {
  month: string;

  totalLiters: number;
  totalAmount: number;
  cowLiters: number;
  buffaloLiters: number;

  dayCount: number;
  farmerCount: number;
  entryCount: number;

  dayRows: {
    date: string;
    liters: number;
    amount: number;
  }[];

  farmerRows: {
    farmerId: string;
    farmerCode: string;
    farmerName: string;
    liters: number;
    amount: number;
  }[];
};

export const getMonthlyMilkReport = (month: string) =>
  api.get<MonthlyMilkReportResponse>("/reports/monthly-milk", {
    params: { month },
  });
