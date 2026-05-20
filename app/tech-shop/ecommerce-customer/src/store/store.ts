import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/auth.slice";
import { categoryApi } from "../features/category/category.api";
import { productApi } from "../features/product/product.api";
import { cartApi } from "../features/cart/cart.api";
import { userApi } from "../features/profile/profile.api";
import { wishlistApi } from "../features/wishlist/wishlist.api";
import { walletApi } from "../features/wallet/wallet.api";
import { addressApi } from "../features/address/address.api";
import { orderApi } from "../features/order/order.api";
import { reviewApi } from "../features/review/review.api";


export const store = configureStore({
  reducer: {
    auth: authReducer,
    [categoryApi.reducerPath]: categoryApi.reducer,
    [productApi.reducerPath]: productApi.reducer,
    [cartApi.reducerPath]: cartApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [wishlistApi.reducerPath]: wishlistApi.reducer,
    [walletApi.reducerPath]: walletApi.reducer,
    [addressApi.reducerPath]: addressApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
    [reviewApi.reducerPath]: reviewApi.reducer
  },
  middleware: (gDf) =>
    gDf().concat(
      categoryApi.middleware,
      productApi.middleware,
      cartApi.middleware,
      userApi.middleware,
      wishlistApi.middleware,
      walletApi.middleware,
      addressApi.middleware,
      orderApi.middleware,
      reviewApi.middleware
    )
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
