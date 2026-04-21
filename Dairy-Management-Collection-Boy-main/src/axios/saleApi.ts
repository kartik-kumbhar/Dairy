// src/axios/saleApi.ts

import { api } from "./axiosInstance";

export const getSales = () =>
  api.get("/sales", {
    params: { t: Date.now() }, // ✅ cache breaker
  });

export const addSale = (data: unknown) => api.post("/sales/add", data); // ✅ FIXED
