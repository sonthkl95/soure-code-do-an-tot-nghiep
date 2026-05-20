import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/auth.slice";
import { rolesApi } from "../features/roles/role.api";
import { functionApi } from "../features/functions/function.api";
import { subFunctionApi } from "../features/subfunction/subfunction.api";
import { categoryApi } from "../features/category/category.api";
import { attributeApi } from "../features/attribute/attribute.api";
import { brandApi } from "../features/brand/brand.api";
import { productApi } from "../features/product/product.api";
import { orderApi } from "../features/order/order.api";
import { orderStatsApi } from "../features/order/order-stats.api";
import { inventoryApi } from "../features/inventory/inventory.api";
import { reviewApi } from "../features/review/review.api";
import { userAdminApi } from "../features/user/user.api";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [rolesApi.reducerPath]: rolesApi.reducer,
    [functionApi.reducerPath]: functionApi.reducer,
    [subFunctionApi.reducerPath]: subFunctionApi.reducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [attributeApi.reducerPath]: attributeApi.reducer,
    [brandApi.reducerPath]: brandApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [orderStatsApi.reducerPath]: orderStatsApi.reducer,
    [inventoryApi.reducerPath]: inventoryApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer,
    [userAdminApi.reducerPath]: userAdminApi.reducer
  },
  middleware: (gDf) =>
    gDf().concat(
      rolesApi.middleware,
      functionApi.middleware,
      subFunctionApi.middleware,
      categoryApi.middleware,
      attributeApi.middleware,
      brandApi.middleware,
      productApi.middleware,
      orderApi.middleware,
      orderStatsApi.middleware,
      inventoryApi.middleware,
      reviewApi.middleware,
      userAdminApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
