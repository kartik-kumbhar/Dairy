// src/types/rateChart.ts
import type { MilkType } from "./farmer";


export interface MilkRateChart {
  milkType: MilkType;
  fats: number[];
  snfs: number[];
  rates: number[][];
  baseRate: number;
  fatFactor: number;
  snfFactor: number;
  updatedAt: string;
  effectiveFrom: string;
}
