// src/features/roles/rolesApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import type { Role, RoleCreateForm, RoleEditForm, RoleForm } from "../../types/role.type";
import type { Page } from "../../types/page.type";
import type { ApiResponse } from "../../types/api.type";
export const rolesApi = createApi({
  reducerPath: "roleApi",
  baseQuery,
  tagTypes: ["Roles", "Role"],
  endpoints: (builder) => ({
    getRoles: builder.query<
      Page<Role>,
      {
        keyword: string;
        page: number;
        size: number;
        fields: string[];
        sort: string;
      }
    >({
      query: ({ keyword, page, size, fields, sort }) => ({
        url: "/auth/roles",
        params: { keyword, page, size, fields, sort },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map((p) => ({
                type: "Role" as const,
                id: p.id,
              })),
              { type: "Roles" as const, id: "LIST" },
            ]
          : [{ type: "Roles" as const, id: "LIST" }],
      keepUnusedDataFor: 30,
    }),
    getRoleById: builder.query<RoleForm, string>({
      query: (id) => ({
        url: `/auth/roles/${id}`,

      }),
      providesTags: (result, error, id) => [{ type: "Role", id }],
      keepUnusedDataFor: 0
    }),
    createRole: builder.mutation<ApiResponse, RoleCreateForm>({
      query: (body) => ({
        url: "/auth/roles",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),
    updateRole: builder.mutation<ApiResponse, { id: string; body: RoleForm }>({
      query: ({ id, body }) => ({
        url: `/auth/roles/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Roles", id: "LIST" }],
    }),
    deleteRole: builder.mutation<ApiResponse, string>({
      query: (id) => ({
        url: `/auth/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Roles", id },
        { type: "Roles", id: "LIST" },
      ],
    }),
  }),
  refetchOnFocus: true,
  refetchOnReconnect: true,
});

export const {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useGetRoleByIdQuery
} = rolesApi;
