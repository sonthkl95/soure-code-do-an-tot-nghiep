import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import type { Page } from "../../types/page.type";
import type { Brand, BrandDetail, BrandOption } from "../../types/brand.type";
import type { ApiResponse } from "../../types/api.type";
import type { Order, OrderDetail, UpdateOrderRequest } from "../../types/order.type";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery,
  tagTypes: ["Orders", "Order"],
  endpoints: (builder) => ({
    getAllOrder: builder.query<
      Page<Order>,
      {
        keyword: string;
        page: number;
        size: number;
        fields: string[];
        sort: string;
      }
    >({
      query: ({ keyword, page, size, fields, sort }) => ({
        url: "/api/admin/orders",
        params: { keyword, page, size, fields, sort },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((p) => ({
                type: "Orders" as const,
                id: p.id,
              })),
              { type: "Orders" as const, id: "LIST" },
            ]
          : [{ type: "Orders" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),

    getOrderById: builder.query<OrderDetail, string>({
      query: (id) => ({
        url: `/api/admin/orders/view/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Order", id }],
      keepUnusedDataFor: 0,
    }),
    createOrder: builder.mutation<ApiResponse, FormData>({
      query: (body) => ({
        url: "/api/admin/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
    }),
    updateOrder: builder.mutation<ApiResponse, { id: string; body: UpdateOrderRequest }>({
      query: ({ id, body }) => ({
        url: `/api/admin/orders/${id}/status`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Orders", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAllOrderQuery,
  useGetOrderByIdQuery,
  useUpdateOrderMutation,
} = orderApi;
