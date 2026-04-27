import { getOfflineMilk, setOfflineMilk } from "./offlineMilk";
import { addMilkEntry } from "../axios/milk_api";
import { isReallyOnline } from "./networkService";

export const syncMilkData = async () => {
  if (!(await isReallyOnline())) return;
  const queue = getOfflineMilk();

  if (!queue.length) return;

  const remaining = [];

  for (const entry of queue) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _offlineId: _, ...cleanEntry } = entry;
      await addMilkEntry(cleanEntry);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err?.response?.status === 409) {
        continue;
      }

      remaining.push(entry);
    }
  }

  setOfflineMilk(remaining);
};
