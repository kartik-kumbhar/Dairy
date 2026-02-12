// src/types/rateChart.ts
import type { MilkType } from "./farmer";

export interface MilkRateChart {
  milkType: MilkType;

  fatMin: number;
  fatMax: number;
  fatStep: number;

  snfMin: number;
  snfMax: number;
  snfStep: number;

  fats: number[];
  snfs: number[];
  rates: number[][];

  baseRate: number;
  fatFactor: number;
  snfFactor: number;

  updatedAt: string;
  effectiveFrom: string;
}
