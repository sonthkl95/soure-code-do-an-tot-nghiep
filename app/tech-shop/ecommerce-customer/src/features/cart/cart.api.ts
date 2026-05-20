import { createApi } from "@reduxjs/toolkit/query/react";
import { privateQuery } from "../../lib/baseQuery";
import type { CartResponse } from "../../types/cart.type";

export const cartApi = createApi({
  reducerPath: "cartApi",
  tagTypes: ["Cart"], // Định danh để Auto-Refresh

  baseQuery: privateQuery,
  endpoints: (builder) => ({
    // 1. Lấy giỏ hàng
    getMyCart: builder.query<CartResponse, void>({
      query: () => "/api/orders/cart",
      // Khi dữ liệu trả về, gắn nhãn 'Cart' cho nó
      providesTags: ["Cart"],
    }),

    // 2. Thêm vào giỏ
    addToCart: builder.mutation<void, { skuId: string; quantity: number }>({
      query: (body) => ({
        url: "/api/orders/cart/add",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Cart"],
    }),

    // 3. Xóa sản phẩm
    removeFromCart: builder.mutation<void, string>({
      query: (skuId) => ({
        url: `/api/orders/cart/remove/${skuId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
    useGetMyCartQuery,
    useAddToCartMutation,
    useRemoveFromCartMutation
} = cartApi;
