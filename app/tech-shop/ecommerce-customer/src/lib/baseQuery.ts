import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const publicQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL, // vd: "http://localhost:8081"
});

export const privateQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL, // vd: "http://localhost:8081"
  credentials: "include", // ✅ gửi JSESSIONID (session cookie)
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json");
    return headers;
  },
});
