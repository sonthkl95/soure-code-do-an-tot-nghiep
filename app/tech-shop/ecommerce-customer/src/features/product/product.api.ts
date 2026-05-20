import { createApi } from "@reduxjs/toolkit/query/react";
import { publicQuery } from "../../lib/baseQuery";
import type {
  ProductDetail,
  ProductListItem,
  ProductListResponse,
  ProductsQueryArgs,
  RelatedProductItem,
  Suggest,
} from "../../types/product.type";

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: publicQuery,
  tagTypes: ["Products", "ProductList", "Product"],
  endpoints: (builder) => ({
    suggestProduct: builder.query<Suggest, string>({
      query: (keyword) => ({
        url: `/api/search/suggest?q=${keyword}&limit=8`,
      }),
      keepUnusedDataFor: 0,
    }),
    getProduct: builder.query<ProductDetail, string>({
      query: (productId) => ({
        url: `/api/public/catalog/products/detail/${productId}`,
      }),
      providesTags: ["Product"],
      keepUnusedDataFor: 30,
    }),
    getRelatedProduct: builder.query<
      RelatedProductItem[],
      { productId: string; limit?: number }
    >({
      query: ({ productId, limit = 8 }) => ({
        url: `/api/search/related?productId=${productId}&limit=${limit}`,
      }),
      keepUnusedDataFor: 30,
    }),
    getProductList: builder.query<ProductListResponse, ProductsQueryArgs>({
      query: (args) => {
        const params = new URLSearchParams();

        if (args.q) params.set("q", args.q);

        if (args.brandIds?.length) {
          for (const id of args.brandIds) params.append("brandIds", id);
        }

        if (args.categoryId) params.set("categoryId", args.categoryId);
        if (args.categoryAncestorId)
          params.set("categoryAncestorId", args.categoryAncestorId);

        if (args.minPrice != null)
          params.set("minPrice", String(args.minPrice));
        if (args.maxPrice != null)
          params.set("maxPrice", String(args.maxPrice));
        if (args.rating != null) {
          params.set("minRating", String(args.rating));
        }
        if (args.minDiscount != null) {
          params.set("minDiscount", String(args.minDiscount));
        }

        // --- PHẦN THÊM MỚI: SPECS (Thông số kỹ thuật) ---
        // Giả sử Backend nhận format: &specs=RAM:16GB&specs=Color:Red
        if (args.specs?.length) {
          for (const spec of args.specs) {
            // Format chuỗi gửi đi tùy thuộc vào Backend quy định.
            // Cách phổ biến là nối key và value bằng dấu hai chấm hoặc dấu gạch.
            const specString = `${spec.key}:${spec.value}`;

            params.append("specs", specString);
          }
        }
        params.set("page", String(args.page ?? 0));
        params.set("size", String(args.size ?? 20));
        params.set("sort", args.sort ?? "relevance");

        return `/api/search/products?${params.toString()}`;
      },
    }),
    getHotDealProduct: builder.query<ProductListItem[], void>({
      query: () => ({
        url: "/api/search/products/hot-deals?minDiscount=0.0",
      }),
      providesTags: ["ProductList"],
      keepUnusedDataFor: 30,
    }),
    getTopRated: builder.query<ProductListItem[], void>({
      query: () => "/api/search/products/top-rated",
      providesTags: ["ProductList"],
    }),

    // 3. Lấy sản phẩm theo tầm giá
    getProductsByPriceRange: builder.query<
      ProductListItem[],
      number | undefined
    >({
      query: (maxPrice = 20000000) => ({
        url: "/api/search/products/price-range",
        params: { maxPrice },
      }),
      providesTags: ["ProductList"],
    }),

    // 4. Lấy sản phẩm gợi ý ngẫu nhiên
    getRandomSuggestions: builder.query<ProductListItem[], void>({
      query: () => "/api/search/products/suggestions",
      providesTags: ["ProductList"],
    }),
  }),
});

export const {
  useLazySuggestProductQuery,
  useGetProductQuery,
  useGetRelatedProductQuery,
  useGetProductListQuery,
  useGetHotDealProductQuery,
  useGetTopRatedQuery,
  useGetProductsByPriceRangeQuery,
  useGetRandomSuggestionsQuery,
} = productApi;
