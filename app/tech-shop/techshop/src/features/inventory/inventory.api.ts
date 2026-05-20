import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import type { Page } from "../../types/page.type";
import type { Inventory, InventoryHistory } from "../../types/inventory,type";
import type { ApiResponse } from "../../types/api.type";

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery,
  tagTypes: ["Inventories", "Inventory", "InventoryHistory"],
  endpoints: (builder) => ({
    getAllInventories: builder.query<
      Page<Inventory>,
      {
        keyword: string;
        page: number;
        size: number;
        fields: string[];
        sort: string;
      }
    >({
      query: ({ keyword, page, size, fields, sort }) => ({
        url: "/api/admin/inventories",
        params: { keyword, page, size, fields, sort },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((p) => ({
                type: "Inventories" as const,
                id: p.skuCode,
              })),
              { type: "Inventories" as const, id: "LIST" },
            ]
          : [{ type: "Inventories" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),
    getInventoryHistory: builder.query<
      Page<InventoryHistory>,
      {
        skuCode: string;
        page?: number;
        size?: number;
        type?: string;
        from?: string;
        to?: string;
      }
    >({
      query: ({ skuCode, page = 0, size = 10, type, from, to }) => ({
        url: `/api/admin/inventory/${skuCode}/history`,
        params: {
          page,
          size,
          ...(type ? { type } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      }),
      providesTags: (result, error, arg) => [
        { type: "InventoryHistory", id: arg.skuCode },
        { type: "InventoryHistory", id: "LIST" },
      ],
    }),
    adjustInventory: builder.mutation<
      ApiResponse,
      {
        skuCode: string;
        type: "IMPORT" | "EXPORT" | "ADJUST";
        quantity: number;
        note?: string;
      }
    >({
      query: (body) => ({
        url: `/api/admin/inventories/adjust`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Inventories", id: "LIST" }, // ✅ refetch danh sách
        { type: "InventoryHistory", id: arg.skuCode }, // ✅ refetch đúng history đang mở
      ],
    }),
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

export const {
  useGetAllInventoriesQuery,
  useLazyGetInventoryHistoryQuery,
  useAdjustInventoryMutation,
} = inventoryApi;
