import { createApi } from "@reduxjs/toolkit/query/react";
import { privateQuery } from "../../lib/baseQuery";
import type {
  ICustomerOrderResponse,
  IOrderCreateRequest,
  IOrderDetailsResponse,
  IOrderResponse,
  IPaginatedResponse,
} from "../../types/order.type";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: privateQuery,
  tagTypes: ["Orders"],
  endpoints: (builder) => ({
    createOrder: builder.mutation<IOrderResponse, IOrderCreateRequest>({
      query: (body) => ({
        url: "/api/orders/customer-order",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Orders"],
    }),
    getOrderByNumber: builder.query<IOrderDetailsResponse, string>({
      query: (orderNo) => `/api/orders/customer-order/number/${orderNo}`,
      // Cung cấp tag để có thể refetch thủ công hoặc tự động
      providesTags: (result, error, arg) => [{ type: "Orders", id: arg }],
      keepUnusedDataFor: 30
    }),
    getMyOrders: builder.query<
      IPaginatedResponse<ICustomerOrderResponse>,
      { page: number; size: number }
    >({
      query: ({ page, size }) => ({
        url: `/api/orders/customer-order/my-orders`,
        params: { page, size },
      }),
      providesTags: ["Orders"],
    }),

    // Bạn có thể thêm các endpoint khác như hủy đơn ở đây
    cancelOrder: builder.mutation<void, string>({
      query: (orderNo) => ({
        url: `/api/orders/customer-order/${orderNo}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["Orders"],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrderByNumberQuery,
  useGetMyOrdersQuery,
  useCancelOrderMutation
} = orderApi;
