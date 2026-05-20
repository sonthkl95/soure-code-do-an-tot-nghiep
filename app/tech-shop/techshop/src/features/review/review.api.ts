import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "../../lib/baseQuery";
import type { AdminReview, PaginatedResponse, ReviewStatus } from "../../types/review.type";

export const reviewApi = createApi({
  reducerPath: 'reviewApi',
  baseQuery: baseQuery,
  tagTypes: ['AdminReview'],
  endpoints: (builder) => ({
    // Lấy danh sách cho Admin kèm Filter
    getAdminReviews: builder.query<PaginatedResponse<AdminReview>, { status?: string; rating?: number; productId?: string; page?: number }>({
      query: (params) => ({
        url: '/api/admin/catalog/reviews',
        params,
      }),
      providesTags: ['AdminReview'],
    }),

    // Cập nhật trạng thái (Duyệt/Ẩn)
    updateReviewStatus: builder.mutation<void, { id: string; status: ReviewStatus }>({
      query: ({ id, status }) => ({
        url: `/api/admin/catalog/reviews/${id}/status`,
        method: 'PATCH',
        params: { status },
      }),
      invalidatesTags: ['AdminReview'],
    }),
  }),
});

export const {useGetAdminReviewsQuery, useUpdateReviewStatusMutation} = reviewApi