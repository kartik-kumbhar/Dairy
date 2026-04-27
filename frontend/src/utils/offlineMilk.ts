const KEY = "offline_milk_queue";

// Save
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveOfflineMilk = (entry: any) => {
  const data = JSON.parse(localStorage.getItem(KEY) || "[]");

  data.push({
    ...entry,
    _offlineId: Date.now(),
    status: "pending", // ✅ ADD THIS
  });

  localStorage.setItem(KEY, JSON.stringify(data));
};

// Get
export const getOfflineMilk = () => {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
};

// Clear
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const setOfflineMilk = (data: any[]) => {
  localStorage.setItem(KEY, JSON.stringify(data));
};
