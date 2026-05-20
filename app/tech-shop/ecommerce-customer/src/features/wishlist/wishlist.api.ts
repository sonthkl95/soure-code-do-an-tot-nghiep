import { createApi } from "@reduxjs/toolkit/query/react";
import { privateQuery } from "../../lib/baseQuery";
import type { ProductListItem } from "../../types/product.type";

export const wishlistApi = createApi({
  reducerPath: "wishlistApi",
  baseQuery: privateQuery,
  tagTypes: ["Wishlist"],
  endpoints: (builder) => ({
    getWishlist: builder.query<ProductListItem[], void>({
      query: () => "/api/wishlist",
      providesTags: ["Wishlist"],
    }),

    // 2. TOGGLE: Thêm/Xóa
    toggleWishlist: builder.mutation<
      void,
      { productId: string; action: "add" | "remove" }
    >({
      query: ({ productId, action }) => ({
        url: `/api/wishlist/${productId}`,
        method: action === "add" ? "POST" : "DELETE",
      }),

      // Quan trọng: Khi thêm/xóa xong, báo cho RTK Query biết dữ liệu 'Wishlist' đã cũ,
      // cần gọi lại API getWishlist để lấy dữ liệu mới nhất từ server.
      invalidatesTags: ["Wishlist"],

      // 3. Optimistic Update (Cập nhật giả lập giao diện ngay lập tức)
      async onQueryStarted(
        { productId, action },
        { dispatch, queryFulfilled },
      ) {
        // --- LOGIC XÓA (REMOVE) ---
        // Chúng ta CÓ THỂ làm optimistic update cho việc XÓA vì chỉ cần productId là lọc được.
        if (action === "remove") {
          const patchResult = dispatch(
            wishlistApi.util.updateQueryData(
              "getWishlist",
              undefined,
              (draft) => {
                // draft bây giờ là mảng Object ProductListItem[], không phải string[]
                const index = draft.findIndex(
                  (item) => item.productId === productId,
                );
                if (index !== -1) {
                  draft.splice(index, 1); // Xóa khỏi mảng hiển thị ngay lập tức
                }
              },
            ),
          );
          try {
            await queryFulfilled;
          } catch {
            patchResult.undo(); // Rollback nếu lỗi
          }
        }
      },
    }),
  }),
});

export const { useGetWishlistQuery, useToggleWishlistMutation } = wishlistApi;
