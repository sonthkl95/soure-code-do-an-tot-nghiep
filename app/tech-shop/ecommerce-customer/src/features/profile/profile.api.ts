import { createApi } from "@reduxjs/toolkit/query/react";
import { privateQuery } from "../../lib/baseQuery";
import type { UpdateProfile, UserProfile } from "../../types/profile.type";

export const userApi = createApi({
  reducerPath: "userApi",
  tagTypes: ["Profile"],
  baseQuery: privateQuery,
  endpoints: (builder) => ({
    getMyProfile: builder.query<UserProfile, void>({
      query: () => "/auth/profile",
      providesTags: ["Profile"],
    }),
    updateProfile: builder.mutation<void, FormData>({
      query: (formData) => ({
        url: '/auth/profile/update-all',
        method: 'PUT',
        body: formData, // RTK Query tự động set Content-Type là multipart/form-data
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const { useGetMyProfileQuery, useUpdateProfileMutation } = userApi;
