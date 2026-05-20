import { createApi } from "@reduxjs/toolkit/query/react";
import { privateQuery } from "../../lib/baseQuery";
import type {
    AddressIdRequest,
    ICreateAddressRequest,
  ILocationResponse,
  IUpdateAddressRequest,
  IUserAddress,
} from "../../types/location.type";

export const addressApi = createApi({
  reducerPath: "addressApi",
  baseQuery: privateQuery,
  tagTypes: ["UserAddress"],
  endpoints: (builder) => ({
    // --- 1. LOCATION API (Dữ liệu tỉnh/huyện/xã) ---
    getProvinces: builder.query<ILocationResponse[], void>({
      query: () => "/api/locations/provinces",
    }),
    getDistricts: builder.query<ILocationResponse[], string>({
      query: (provinceCode) => `/api/locations/districts/${provinceCode}`,
    }),
    getWards: builder.query<ILocationResponse[], string>({
      query: (districtCode) => `/api/locations/wards/${districtCode}`,
    }),

    // --- 2. USER ADDRESS API (CRUD địa chỉ người dùng) ---
    getMyAddresses: builder.query<IUserAddress[], void>({
      query: () => "/api/user-addresses/my",
      providesTags: ["UserAddress"],
    }),

    // Tạo mới: Gửi ICreateAddressRequest -> Trả về IUserAddress vừa tạo
    createUserAddress: builder.mutation<IUserAddress, ICreateAddressRequest>({
      query: (body) => ({
        url: "/api/user-addresses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["UserAddress"],
    }),

    // Cập nhật: Gửi IUpdateAddressRequest
    updateUserAddress: builder.mutation<IUserAddress, IUpdateAddressRequest>({
      query: ({ id, ...body }) => ({
        url: `/api/user-addresses/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["UserAddress"],
    }),

    // Xóa: Chỉ cần truyền ID
    deleteUserAddress: builder.mutation<void, AddressIdRequest>({
      query: (id) => ({
        url: `/api/user-addresses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["UserAddress"],
    }),

    // Đặt mặc định: Patch ID
    setDefaultAddress: builder.mutation<IUserAddress, AddressIdRequest>({
      query: (id) => ({
        url: `/api/user-addresses/${id}/set-default`,
        method: "PATCH",
      }),
      invalidatesTags: ["UserAddress"],
    }),
  }),
});

export const {
  useGetProvincesQuery,
  useLazyGetDistrictsQuery, // Dùng Lazy để gọi khi user chọn Province
  useLazyGetWardsQuery, // Dùng Lazy để gọi khi user chọn District
  useGetMyAddressesQuery,
  useCreateUserAddressMutation,
  useUpdateUserAddressMutation,
  useDeleteUserAddressMutation,
  useSetDefaultAddressMutation,
} = addressApi;
