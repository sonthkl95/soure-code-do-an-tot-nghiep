import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import type { ApiResponse } from "../../types/api.type";
import type { Page } from "../../types/page.type";
import type {
  DiscontinuedForm,
  Product,
  ProductDetail,
} from "../../types/product.type";

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery,
  tagTypes: ["Products", "Product"],
  endpoints: (builder) => ({
    getAllProduct: builder.query<
      Page<Product>,
      {
        keyword: string;
        page: number;
        size: number;
        fields: string[];
        sort: string;
      }
    >({
      query: ({ keyword, page, size, fields, sort }) => ({
        url: "/api/admin/catalog/products",
        params: { keyword, page, size, fields, sort },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((p) => ({
                type: "Products" as const,
                id: p.id,
              })),
              { type: "Products" as const, id: "LIST" },
            ]
          : [{ type: "Products" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),
    getProductById: builder.query<ProductDetail, string>({
      query: (id) => ({
        url: `/api/admin/catalog/products/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Product", id }],
      keepUnusedDataFor: 0,
    }),
    createProduct: builder.mutation<
      ApiResponse,
      { idemKey: string; body: FormData }
    >({
      query: ({ idemKey, body }) => ({
        url: "/api/admin/catalog/products",
        method: "POST",
        body,
        headers: {
          "Idempotency-Key": idemKey,
        },
      }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),
    updateProduct: builder.mutation<
      ApiResponse,
      { id: string; idemKey: string; body: FormData }
    >({
      query: ({ id, idemKey, body }) => ({
        url: `/api/admin/catalog/products/${id}`,
        method: "PUT",
        body,
        headers: {
          "Idempotency-Key": idemKey,
        },
      }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),
    discontinuedSku: builder.mutation<
      ApiResponse<string>,
      { id: string; idemKey: string; body: DiscontinuedForm }
    >({
      query: ({ id, idemKey, body }) => ({
        url: `/api/admin/catalog/products/sku/${id}/discontinued`,
        method: "PATCH",
        body,
        headers: {
          "Idempotency-Key": idemKey,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Products", id: "LIST" },
        ...(result?.data
          ? [{ type: "Product" as const, id: result.data }]
          : []),
      ],
    }),
    deleteProduct: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/api/admin/catalog/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Products", id: "LIST" }],
    }),
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

export const {
  useGetAllProductQuery,
  useUpdateProductMutation,
  useGetProductByIdQuery,
  useDeleteProductMutation,
  useCreateProductMutation,
  useDiscontinuedSkuMutation,
} = productApi;
