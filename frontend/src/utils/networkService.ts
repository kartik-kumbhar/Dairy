import { api } from "../axios/axiosInstance";
export const isReallyOnline = async (): Promise<boolean> => {
  if (!navigator.onLine) return false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    await api.get("/health");

    clearTimeout(timeout);
    return true;
  } catch {
    return false;
  }
};
