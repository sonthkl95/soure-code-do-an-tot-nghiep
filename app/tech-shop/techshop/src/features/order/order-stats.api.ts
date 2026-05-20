import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import type {
  OrderStatsOverview,
  OrderDailyStats,
  TopProductStats,
} from "../../types/order-stats.type";

const toNum = (v: any) => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
};

const pick = (obj: any, keys: string[]) => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k];
  }
  return undefined;
};

export const orderStatsApi = createApi({
  reducerPath: "orderStatsApi",
  baseQuery,
  tagTypes: ["OrderStats"],
  endpoints: (builder) => ({
    getOverview: builder.query<OrderStatsOverview, { from: string; to: string }>({
      query: ({ from, to }) => ({
        url: "/api/admin/stats/overview", // ✅ nhớ đúng endpoint BE của bạn
        params: { from, to },
      }),
      transformResponse: (res: any): OrderStatsOverview => ({
        totalOrders: toNum(pick(res, ["totalOrders", "total_orders"])),
        deliveredOrders: toNum(pick(res, ["deliveredOrders", "delivered_orders"])),
        cancelledOrders: toNum(pick(res, ["cancelledOrders", "cancelled_orders"])),

        revenue: toNum(pick(res, ["revenue"])),
        grossAmount: toNum(pick(res, ["grossAmount", "gross_amount"])),
        discountAmount: toNum(pick(res, ["discountAmount", "discount_amount"])),

        itemsSold: toNum(pick(res, ["itemsSold", "items_sold"])),

        codOrders: toNum(pick(res, ["codOrders", "cod_orders"])),
        vnpayOrders: toNum(pick(res, ["vnpayOrders", "vnpay_orders"])),
        bankTransferOrders: toNum(pick(res, ["bankTransferOrders", "bank_transfer_orders"])),
      }),
      providesTags: [{ type: "OrderStats", id: "OVERVIEW" }],
      keepUnusedDataFor: 30,
    }),

    getDaily: builder.query<OrderDailyStats[], { from: string; to: string }>({
      query: ({ from, to }) => ({
        url: "/api/admin/stats/daily",
        params: { from, to },
      }),
      transformResponse: (res: any[]): OrderDailyStats[] =>
        (res ?? [])
          .map((x) => ({
            statDate: String(pick(x, ["statDate", "stat_date", "date"]) ?? ""),
            totalOrders: toNum(pick(x, ["totalOrders", "total_orders", "orders"])),
            revenue: toNum(pick(x, ["revenue"])),
          }))
          .filter((x) => x.statDate), // ✅ bỏ record lỗi
      providesTags: [{ type: "OrderStats", id: "DAILY" }],
      keepUnusedDataFor: 30,
    }),

    getTopProducts: builder.query<TopProductStats[], { from: string; to: string; limit?: number }>({
      query: ({ from, to, limit = 10 }) => ({
        url: "/api/admin/stats/top-products",
        params: { from, to, limit },
      }),
      transformResponse: (res: any[]): TopProductStats[] =>
        (res ?? []).map((x) => ({
          productId: String(pick(x, ["productId", "product_id"]) ?? ""),
          productName: String(pick(x, ["productName", "product_name"]) ?? ""),
          quantity: toNum(pick(x, ["quantity"])),
          revenue: toNum(pick(x, ["revenue"])),
        })),
      providesTags: [{ type: "OrderStats", id: "TOP_PRODUCTS" }],
      keepUnusedDataFor: 30,
    }),
  }),
});

export const { useGetOverviewQuery, useGetDailyQuery, useGetTopProductsQuery } =
  orderStatsApi;
