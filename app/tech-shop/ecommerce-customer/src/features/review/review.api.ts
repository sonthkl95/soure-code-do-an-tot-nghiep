import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  IRatingSummary,
  IReviewResponse,
  ReviewRequest,
} from "../../types/review.type";
import { privateQuery } from "../../lib/baseQuery";
import type { ApiResponse } from "../../types/page.type";

export const reviewApi = createApi({
  reducerPath: "reviewApi",
  baseQuery: privateQuery,
  tagTypes: ["Review"],
  endpoints: (builder) => ({
    // Mutation gửi đánh giá hàng loạt
    submitBatchReviews: builder.mutation<ApiResponse<void>, ReviewRequest[]>({
      query: (reviews) => ({
        url: "/api/catalog/products/submit",
        method: "POST",
        body: reviews,
      }),
      invalidatesTags: ["Review"],
    }),
    getReviewSummary: builder.query<IRatingSummary, string>({
      query: (productId) => `/api/catalog/reviews/product/${productId}/summary`,
      providesTags: (result, error, productId) => [
        { type: "Review", id: productId },
      ],
    }),

    // 2. Lấy danh sách review (phân trang)
    getProductReviews: builder.query<
      IReviewResponse,
      { productId: string; rating?: number; page?: number; size?: number }
    >({
      query: ({ productId, ...params }) => ({
        url: `/api/catalog/reviews/product/${productId}`,
        params: params,
      }),
      providesTags: (result, error, { productId }) => [
        { type: "Review", id: productId },
      ],
    }),
  }),
});

export const {
  useSubmitBatchReviewsMutation,
  useGetReviewSummaryQuery,
  useGetProductReviewsQuery,
} = reviewApi;
