// // src/context/AppContext.tsx
// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
// } from "react";

// import { StorageKey } from "../storage/storageKeys";
// import { getJSON, setJSON } from "../storage/localStorage";

// import type { Farmer, MilkType } from "../types/farmer";
// import type {
//   MilkCollection,
//   MilkShift,
// } from "../types/milkCollection";
// import type {
//   Deduction,
//   DeductionCategory,
// } from "../types/deduction";

// type AppState = {
//   initialized: boolean;
//   farmers: Farmer[];
//   milkCollections: MilkCollection[];
//   deductions: Deduction[];
// };

// type AddFarmerInput = {
//   name: string;
//   mobile: string;
//   milkType: MilkType;
//   address?: string;
// };

// type AddMilkCollectionInput = {
//   date: string;
//   shift: MilkShift;
//   farmerId: string;
//   milkType: MilkType;
//   liters: number;
//   fat: number;
//   snf: number;
//   rate: number;
//   remarks?: string;
// };

// type AddDeductionInput = {
//   date: string;
//   farmerId: string;
//   category: DeductionCategory;
//   amount: number;
//   description?: string;
// };

// type AppContextValue = AppState & {
//   addFarmer: (input: AddFarmerInput) => Farmer;
//   addMilkCollection: (input: AddMilkCollectionInput) => MilkCollection;
//   addDeduction: (input: AddDeductionInput) => Deduction;
// };

// const AppContext = createContext<AppContextValue | undefined>(
//   undefined
// );

// export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
//   children,
// }) => {
//   const [state, setState] = useState<AppState>({
//     initialized: false,
//     farmers: [],
//     milkCollections: [],
//     deductions: [],
//   });

//   // Load all data from localStorage once
//   useEffect(() => {
//     const farmers = getJSON<Farmer[]>(StorageKey.Farmers, []);
//     const milkCollections = getJSON<MilkCollection[]>(
//       StorageKey.MilkCollections,
//       []
//     );
//     const deductions = getJSON<Deduction[]>(
//       StorageKey.Deductions,
//       []
//     );

//     setState({
//       initialized: true,
//       farmers,
//       milkCollections,
//       deductions,
//     });
//   }, []);

//   // Persist whenever slices change
//   useEffect(() => {
//     if (!state.initialized) return;
//     setJSON(StorageKey.Farmers, state.farmers);
//   }, [state.initialized, state.farmers]);

//   useEffect(() => {
//     if (!state.initialized) return;
//     setJSON(StorageKey.MilkCollections, state.milkCollections);
//   }, [state.initialized, state.milkCollections]);

//   useEffect(() => {
//     if (!state.initialized) return;
//     setJSON(StorageKey.Deductions, state.deductions);
//   }, [state.initialized, state.deductions]);

//   // Helpers
//   const generateNextFarmerCode = (farmers: Farmer[]): string => {
//     const nums = farmers
//       .map((f) => parseInt(f.code.replace(/^F/i, ""), 10))
//       .filter((n) => !Number.isNaN(n));
//     const next = nums.length ? Math.max(...nums) + 1 : 1;
//     return `F${String(next).padStart(3, "0")}`;
//   };

//   // Actions
//   const addFarmer = (input: AddFarmerInput): Farmer => {
//     const todayISO = new Date().toISOString().slice(0, 10);

//     const newFarmer: Farmer = {
//         id: crypto.randomUUID
//             ? crypto.randomUUID()
//             : String(Date.now()),
//         code: generateNextFarmerCode(state.farmers),
//         name: input.name.trim(),
//         mobile: input.mobile.trim(),
//         milkType: input.milkType,
//         address: input.address?.trim() || undefined,
//         status: "Active",
//         joinDate: todayISO,
//     };

//     setState((prev) => ({
//       ...prev,
//       farmers: [...prev.farmers, newFarmer],
//     }));

//     return newFarmer;
//   };

//   const addMilkCollection = (
//     input: AddMilkCollectionInput
//   ): MilkCollection => {
//     const farmer = state.farmers.find(
//       (f) => f.id === input.farmerId
//     );
//     if (!farmer) {
//       throw new Error("Farmer not found for milk collection");
//     }

//     const amount = input.liters * input.rate;
//     const now = new Date();

//     const entry: MilkCollection = {
//       id: crypto.randomUUID
//         ? crypto.randomUUID()
//         : String(Date.now()),
//       date: input.date,
//       shift: input.shift,
//       farmerId: farmer.id,
//       farmerCode: farmer.code,
//       farmerName: farmer.name,
//       milkType: input.milkType,
//       liters: input.liters,
//       fat: input.fat,
//       snf: input.snf,
//       rate: input.rate,
//       amount,
//       remarks: input.remarks?.trim() || undefined,
//       createdAt: now.toISOString(),
//     };

//     setState((prev) => ({
//       ...prev,
//       milkCollections: [...prev.milkCollections, entry],
//     }));

//     return entry;
//   };

//   const addDeduction = (input: AddDeductionInput): Deduction => {
//     const farmer = state.farmers.find(
//       (f) => f.id === input.farmerId
//     );
//     if (!farmer) {
//       throw new Error("Farmer not found for deduction");
//     }

//     const nowISO = new Date().toISOString();
//     const d: Deduction = {
//       id: crypto.randomUUID
//         ? crypto.randomUUID()
//         : String(Date.now()),
//       date: input.date,
//       farmerId: farmer.id,
//       farmerCode: farmer.code,
//       farmerName: farmer.name,
//       category: input.category,
//       amount: input.amount,
//       remainingAmount: input.amount,
//       description: input.description?.trim() || undefined,
//       status: "Pending",
//       createdAt: nowISO,
//       updatedAt: nowISO,
//     };

//     setState((prev) => ({
//       ...prev,
//       deductions: [...prev.deductions, d],
//     }));

//     return d;
//   };

//   const value: AppContextValue = {
//     ...state,
//     addFarmer,
//     addMilkCollection,
//     addDeduction,
//   };

//   return (
//     <AppContext.Provider value={value}>{children}</AppContext.Provider>
//   );
// };

// // Hook to use context
// export const useAppContext = (): AppContextValue => {
//   const ctx = useContext(AppContext);
//   if (!ctx) {
//     throw new Error("useAppContext must be used inside <AppProvider>");
//   }
//   return ctx;
// };



// src/context/AppContext.tsx
import React, { createContext, useEffect, useState } from "react";

import type { Farmer, MilkType } from "../types/farmer";
import type { MilkCollection, MilkShift } from "../types/milkCollection";
import type { Deduction, DeductionCategory } from "../types/deduction";

import { addFarmer as addFarmerAPI, getFarmers } from "../axios/farmer_api";
import { addMilkEntry as addMilkEntryAPI, getMilkEntries } from "../axios/milk_api";
import { addDeduction as addDeductionAPI, getDeductions } from "../axios/deduction_api";

type AppState = {
  initialized: boolean;
  farmers: Farmer[];
  milkCollections: MilkCollection[];
  deductions: Deduction[];
};

type AddFarmerInput = {
  name: string;
  mobile: string;
  milkType: MilkType;
  address?: string;
};

type AddMilkCollectionInput = {
  date: string;
  shift: MilkShift;
  farmerId: string;
  milkType: MilkType;
  liters: number;
  fat: number;
  snf: number;
  rate: number;
  remarks?: string;
};

type AddDeductionInput = {
  date: string;
  farmerId: string;
  category: DeductionCategory;
  amount: number;
  description?: string;
};

export type AppContextValue = AppState & {
  addFarmer: (input: AddFarmerInput) => Promise<void>;
  addMilkCollection: (input: AddMilkCollectionInput) => Promise<void>;
  addDeduction: (input: AddDeductionInput) => Promise<void>;
  reloadAll: () => Promise<void>;
  loading: boolean;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>({
    initialized: false,
    farmers: [],
    milkCollections: [],
    deductions: [],
  });

  const [loading, setLoading] = useState(false);

  // Load all data from backend
  const reloadAll = async () => {
    try {
      setLoading(true);

      const [farmersRes, milkRes, deductionRes] = await Promise.all([
        getFarmers(),
        getMilkEntries(),
        getDeductions(),
      ]);

      setState({
        initialized: true,
        farmers: farmersRes.data,
        milkCollections: milkRes.data,
        deductions: deductionRes.data,
      });
    } catch (error) {
      console.error("Error loading app data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadAll();
  }, []);

  // Add farmer
  const addFarmer = async (input: AddFarmerInput): Promise<void> => {
    try {
      setLoading(true);

      await addFarmerAPI({
        name: input.name.trim(),
        mobile: input.mobile.trim(),
        milkType: input.milkType,
        address: input.address?.trim() || undefined,
      });

      await reloadAll();
    } catch (error) {
      console.error("Error adding farmer:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add milk collection
  const addMilkCollection = async (
    input: AddMilkCollectionInput
  ): Promise<void> => {
    try {
      setLoading(true);

      await addMilkEntryAPI({
        date: input.date,
        shift: input.shift,
        farmerId: input.farmerId,
        milkType: input.milkType,
        liters: input.liters,
        fat: input.fat,
        snf: input.snf,
        rate: input.rate,
        remarks: input.remarks?.trim() || undefined,
      });

      await reloadAll();
    } catch (error) {
      console.error("Error adding milk entry:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Add deduction
  const addDeduction = async (input: AddDeductionInput): Promise<void> => {
    try {
      setLoading(true);

      await addDeductionAPI({
        date: input.date,
        farmerId: input.farmerId,
        category: input.category,
        amount: input.amount,
        description: input.description?.trim() || undefined,
      });

      await reloadAll();
    } catch (error) {
      console.error("Error adding deduction:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AppContextValue = {
    ...state,
    addFarmer,
    addMilkCollection,
    addDeduction,
    reloadAll,
    loading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Hook to use context
export { AppContext };

