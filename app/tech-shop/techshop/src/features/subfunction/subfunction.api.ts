import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import type { Page } from "../../types/page.type";
import type { ApiResponse } from "../../types/api.type";
import type { SubFunctionCreateForm, SubFunctionEditForm, SubFunction } from "../../types/subFunction.type";
type UpdateArg = { id: string; body: SubFunctionEditForm };
type SubFunctionSearch = {
  keyword: string;
  ids: string[];
}
export const subFunctionApi = createApi({
  reducerPath: "subfunctionApi",
  baseQuery,
  tagTypes: ["SubFunctions", "SubFunction", "SubFunctionOptions"],
  endpoints: (builder) => ({
    getSubFunctions: builder.query<
      Page<SubFunction>,
      {
        keyword: string;
        page: number;
        size: number;
        fields: string[];
        sort: string;
      }
    >({
      query: ({ keyword, page, size, fields, sort }) => ({
        url: "/auth/subfunctions",
        params: { keyword, page, size, fields, sort },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((p) => ({
                type: "SubFunctions" as const,
                id: p.id,
              })),
              { type: "SubFunctions" as const, id: "LIST" },
            ]
          : [{ type: "SubFunctions" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),
    getSubFunctionOptions: builder.mutation<SubFunction[], SubFunctionSearch>({
      query: (body) => ({
        url: "/auth/subfunctions/list/options",
        method: "POST",
        body
      }),
      invalidatesTags: [{type: "SubFunctionOptions", id: "LIST"}],
    }),
    getSubFunctionById: builder.query<SubFunction, string>({
      query: (id) => ({
        url: `/auth/subfunctions/${id}`,
      }),
      keepUnusedDataFor: 0, // xóa cache ngay khi unmount
      providesTags: (result, error, id) => [{ type: "SubFunction", id }],
    }),
    createSubFunction: builder.mutation<ApiResponse<string>, SubFunctionCreateForm>({
      query: (body) => ({
        url: "/auth/subfunctions",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "SubFunctions", id: "LIST" }],
    }),
    updateSubFunction: builder.mutation<
      ApiResponse,
      UpdateArg
    >({
      query: ({ id, body }) => ({
        url: `/auth/subfunctions/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "SubFunctions", id: arg.id },
        { type: "SubFunctions", id: "LIST" },
      ],
    }),
    deleteSubFunction: builder.mutation<
      ApiResponse, // tuỳ backend trả gì
      string // id
    >({
      query: (id) => ({
        url: `/auth/subfunctions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "SubFunctions", id },
        { type: "SubFunctions", id: "LIST" },
      ],
    }),
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

export const {
  useGetSubFunctionsQuery,
  useCreateSubFunctionMutation,
  useUpdateSubFunctionMutation,
  useDeleteSubFunctionMutation,
  useGetSubFunctionByIdQuery,
  useGetSubFunctionOptionsMutation
} = subFunctionApi;
