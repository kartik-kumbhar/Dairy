import { api } from "./axiosInstance";
import type { MilkCollection } from "../types/milkCollection";
import type { MilkType } from "../types/farmer";

export type RateConfig = {
  fatMin: number;
  fatMax: number;
  snfMin: number;
  snfMax: number;
  fats: number[];
  snfs: number[];
  rateChart: number[][];
};
export type AddMilkRequest = {
  date: string;
  shift: "morning" | "evening";
  farmerId: string;
  quantity: number;
  milkType: MilkType;
  fat: number;
  snf: number;
  rate: number;
};

export const getRateForMilk = (params: {
  milkType: string;
  fat: number;
  snf: number;
  date: string;
}) => api.get("/rate-chart/rate", { params });

export const addMilkEntry = (data: AddMilkRequest) =>
  api.post<MilkCollection>("/milk", data);

export const getMilkEntries = () => api.get<MilkCollection[]>("/milk");

export const deleteMilkEntry = (id: string) =>
  api.delete<{ message: string }>(`/milk/${id}`);

export const getRateConfig = (params: { milkType: string; date: string }) =>
  api.get("/rate-chart/config", { params });

export const updateMilkEntry = (id: string, data: AddMilkRequest) =>
  api.put(`/milk/${id}`, data);

export const getMachineData = () => api.get("/machine");
