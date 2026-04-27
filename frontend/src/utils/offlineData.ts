import type { Farmer } from "../types/farmer";
import type { MilkCollection } from "../types/milkCollection";

const FARMERS_KEY = "offline_farmers";
const MILK_KEY = "offline_milk_list";

export const saveFarmers = (data: Farmer[]) => {
  localStorage.setItem(FARMERS_KEY, JSON.stringify(data));
};

export const getFarmersLocal = (): Farmer[] => {
  return JSON.parse(localStorage.getItem(FARMERS_KEY) || "[]");
};

export const saveMilkList = (data: MilkCollection[]) => {
  localStorage.setItem(MILK_KEY, JSON.stringify(data));
};

export const getMilkListLocal = (): MilkCollection[] => {
  return JSON.parse(localStorage.getItem(MILK_KEY) || "[]");
};
