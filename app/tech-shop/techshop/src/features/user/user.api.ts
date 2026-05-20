import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  UserSummary,
  UserDetail,
  UserStatusRequest,
  Role,
  UserProfileResponse,
  UpdateProfileRequest,
} from "../../types/user.types";
import type { PaginatedResponse } from "../../types/page.type";
import { baseQuery } from "../../lib/baseQuery";

export const userAdminApi = createApi({
  reducerPath: "userAdminApi",
  baseQuery: baseQuery,
  tagTypes: ["AdminUser", "Roles", "Profile"],
  endpoints: (builder) => ({
    // 1. Lấy danh sách User (hỗ trợ phân trang, tìm kiếm, lọc status)
    getAdminUsers: builder.query<
      PaginatedResponse<UserSummary>,
      { q?: string; status?: number; page: number; size: number }
    >({
      query: (params) => ({
        url: "/auth/users",
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({
                type: "AdminUser" as const,
                id,
              })),
              { type: "AdminUser", id: "LIST" },
            ]
          : [{ type: "AdminUser", id: "LIST" }],
    }),

    // 2. Xem chi tiết User
    getUserDetail: builder.query<UserDetail, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "AdminUser", id }],
    }),

    // 3. Cập nhật trạng thái (Khóa/Mở khóa)
    updateUserStatus: builder.mutation<
      void,
      { id: string; body: UserStatusRequest }
    >({
      query: ({ id, body }) => ({
        url: `/auth/users/${id}/status`,
        method: "PATCH",
        body,
      }),
      // Tự động refetch User cụ thể và danh sách tổng
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminUser", id },
        { type: "AdminUser", id: "LIST" },
      ],
    }),
    getRoles: builder.query<Role[], void>({
      query: () => "/auth/users/roles", // API lấy danh sách Role
      providesTags: ["Roles"],
    }),

    updateUserRole: builder.mutation<void, { userId: string; roleId: number }>({
      query: ({ userId, roleId }) => ({
        url: `/auth/users/${userId}/role`,
        method: "PATCH",
        params: { roleId }, // Gửi roleId lên backend
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "AdminUser", id: userId },
        { type: "AdminUser", id: "LIST" },
      ],
    }),
    getProfile: builder.query<UserProfileResponse, void>({
      query: () => "/auth/profile/auth",
      providesTags: ["Profile"],
    }),

    // 2. API cập nhật thông tin cá nhân
    updateProfile: builder.mutation<void, UpdateProfileRequest>({
      query: (body) => ({
        url: "/auth/profile/auth",
        method: "PUT",
        body,
      }),
      // Sau khi update thành công, tag 'Profile' bị xóa
      // giúp getProfile tự động gọi lại để lấy dữ liệu mới
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useGetUserDetailQuery,
  useUpdateUserStatusMutation,
  useGetRolesQuery,
  useUpdateUserRoleMutation,
  useGetProfileQuery,
  useUpdateProfileMutation
} = userAdminApi;
