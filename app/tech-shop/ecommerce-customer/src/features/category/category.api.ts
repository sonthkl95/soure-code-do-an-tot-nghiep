import { createApi } from "@reduxjs/toolkit/query/react";
import { publicQuery } from "../../lib/baseQuery";
import type { Category, CategoryFilterResponse } from "../../types/category.type";

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: publicQuery,
  tagTypes: ["Categories"],
  endpoints: (builder) => ({
    getAllCategories: builder.query<Category[], null>({
      query: () => ({
        url: "/api/public/catalog/menu",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({
                type: "Categories" as const,
                id: p.id,
              })),
              { type: "Categories" as const, id: "LIST" },
            ]
          : [{ type: "Categories" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),
    getFilter: builder.query<CategoryFilterResponse, string>({
      query: (categoryId) => `/api/public/catalog/categories/filters/${categoryId}`
    })
  }),
});

export const { useGetAllCategoriesQuery, useGetFilterQuery } = categoryApi;
