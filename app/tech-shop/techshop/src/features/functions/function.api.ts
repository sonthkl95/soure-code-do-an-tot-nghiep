import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";

import type {
  FunctionCreateForm,
  FunctionData,
  FunctionEntity,
  FunctionOption,
} from "../../types/function.type";
import type { Page } from "../../types/page.type";
import type { ApiResponse } from "../../types/api.type";
export const functionApi = createApi({
  reducerPath: "functionApi",
  baseQuery,
  tagTypes: ["All_Function", "Functions", "Function_Option","Function" ],
  endpoints: (builder) => ({
    getAllFunctions: builder.query<FunctionEntity[], null>({
      query: () => ({
        url: "/auth/functions/all",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({
                type: "All_Function" as const,
                id: p.id,
              })),
              { type: "All_Function" as const, id: "LIST" },
            ]
          : [{ type: "All_Function" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),
    getFunctions: builder.query<
      Page<FunctionData>,
      {
        keyword: string;
        page: number;
        size: number;
        fields: string[];
        sort: string;
      }
    >({
      query: ({ keyword, page, size, fields, sort }) => ({
        url: "/auth/functions",
        params: { keyword, page, size, fields, sort },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((p) => ({
                type: "Function" as const,
                id: p.id,
              })),
              { type: "Functions" as const, id: "LIST" },
            ]
          : [{ type: "Functions" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),
    getFunctionById: builder.query<FunctionEntity, string>({
      query: (id) => ({
        url: `/auth/functions/${id}`
      }),
      keepUnusedDataFor: 0,
      providesTags: (result, error, id) => [{ type: "Function", id }]
    }),
    getFunctionOptions: builder.query<FunctionOption[], null>({
      query: () => ({
        url: "/auth/functions/options",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({
                type: "Function_Option" as const,
                id: p.id,
              })),
              { type: "Function_Option" as const, id: "LIST" },
            ]
          : [{ type: "Function_Option" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),
    createFunction: builder.mutation<ApiResponse, FunctionCreateForm>({
      query: (body) => ({
        url: "/auth/functions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Functions", id: "LIST" }],
    }),
    updateFunction: builder.mutation<ApiResponse, {id: string, body: FunctionEntity}>({
      query: ({id, body}) => ({
        url: `/auth/functions/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Functions", id: "LIST" }],
    }),
    deleteFunction: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/auth/functions/${id}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Functions", id },
        { type: "Functions", id: "LIST" },
      ],
    })
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

export const {
  useGetAllFunctionsQuery,
  useGetFunctionsQuery,
  useGetFunctionOptionsQuery,
  useCreateFunctionMutation,
  useUpdateFunctionMutation,
  useGetFunctionByIdQuery,
  useDeleteFunctionMutation
} = functionApi;
