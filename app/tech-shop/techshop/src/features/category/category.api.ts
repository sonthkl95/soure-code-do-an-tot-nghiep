import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import type { Page } from "../../types/page.type";
import type {
  Category,
  CategoryOption,
  CategoryDetail,
} from "../../types/category.type";
import type { ApiResponse } from "../../types/api.type";

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery,
  tagTypes: ["Categories", "Category_Option", "Category", "Category_Leaf"],
  endpoints: (builder) => ({
    getAllCategories: builder.query<
      Page<Category>,
      {
        keyword: string;
        page: number;
        size: number;
        fields: string[];
        sort: string;
      }
    >({
      query: ({ keyword, page, size, fields, sort }) => ({
        url: "/api/admin/catalog/categories",
        params: { keyword, page, size, fields, sort },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((p) => ({
                type: "Categories" as const,
                id: p.id,
              })),
              { type: "Categories" as const, id: "LIST" },
            ]
          : [{ type: "Categories" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),
    getCategoryById: builder.query<CategoryDetail, string>({
      query: (id) => ({
        url: `/api/admin/catalog/categories/${id}`,
      }),
      providesTags: (result, error, id) => [{ type: "Category", id }],
      keepUnusedDataFor: 0,
    }),
    getCategoryOption: builder.query<CategoryOption[], null>({
      query: () => ({
        url: "/api/admin/catalog/categories/options",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({
                type: "Category_Option" as const,
                id: p.id,
              })),
              { type: "Category_Option" as const, id: "LIST" },
            ]
          : [{ type: "Category_Option" as const, id: "LIST" }],
      keepUnusedDataFor: 0,
    }),
    getLeafCategory: builder.query<CategoryOption[], null>({
      query: () => ({
        url: "/api/admin/catalog/categories/leaf",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({
                type: "Category_Option" as const,
                id: p.id,
              })),
              { type: "Category_Leaf" as const, id: "LIST" },
            ]
          : [{ type: "Category_Leaf" as const, id: "LIST" }],
      keepUnusedDataFor: 0,
    }),
    createCategory: builder.mutation<ApiResponse, FormData>({
      query: (body) => ({
        url: "/api/admin/catalog/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),
    updateCategory: builder.mutation<
      ApiResponse,
      { id: string; idemKey: string, body: FormData }
    >({
      query: ({ id, idemKey, body }) => ({
        url: `/api/admin/catalog/categories/${id}`,
        method: "PUT",
        body,
        headers: {
          "Idempotency-Key": idemKey,
        },
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),
    changeActiveCategory: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/api/admin/catalog/categories/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: [{ type: "Categories", id: "LIST" }],
    }),
    deleteCategory: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/api/admin/catalog/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Categories", id },
        { type: "Categories", id: "LIST" },
      ],
    }),
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

export const {
  useGetAllCategoriesQuery,
  useGetLeafCategoryQuery,
  useGetCategoryByIdQuery,
  useLazyGetCategoryByIdQuery,
  useDeleteCategoryMutation,
  useGetCategoryOptionQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useChangeActiveCategoryMutation
} = categoryApi;
