import { createApi } from "@reduxjs/toolkit/query/react";
import type { WalletResponse, TransactionDto, VnpayUrlResponse } from "../../types/wallet.type";
import { privateQuery } from "../../lib/baseQuery";
import type { ApiResponse, SpringPage } from "../../types/page.type";

export const walletApi = createApi({
  reducerPath: "walletApi",
  baseQuery: privateQuery,
  tagTypes: ["Wallet", "Transactions"],

  endpoints: (builder) => ({
    getMyWallet: builder.query<WalletResponse, void>({
      query: () => "/api/payments/wallets/me",
      // Bóc tách lấy phần 'result' từ ApiResponse
      providesTags: ["Wallet"],
    }),
    getVnPayUrl: builder.query<VnpayUrlResponse, {amount: number}>({
        query: ({amount}) => ({
            url: `/api/payments/vnpay/create-payment?amount=${amount}&type=DEPOSIT`,
        }),
        
    }),
    getMyTransactions: builder.query<
      SpringPage<TransactionDto>,
      { page: number; size: number }
    >({
      query: ({ page, size }) => ({
        url: "/api/payments/wallets/me/transactions",
        params: { page, size },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.content.map(({ id }) => ({
                type: "Transactions" as const,
                id,
              })),
              { type: "Transactions", id: "LIST" },
            ]
          : [{ type: "Transactions", id: "LIST" }],
    }),
    getDepositQr: builder.query<string, number>({
      query: (amount) => `/api/payments/api/sepay/deposit-qr?amount=${amount}&type=DEPOSIT`,
      // Backend trả về ApiResponse<String>, nên lấy .result
      transformResponse: (response: ApiResponse<string>) => response.data,
    }),
    requestDeposit: builder.mutation<void, { amount: number; source: string }>({
      query: (body) => ({
        url: "/api/wallets/internal/deposit",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Wallet", "Transactions"],
    }),
  }),
});

export const {
  useGetMyWalletQuery,
  useGetMyTransactionsQuery,
  useRequestDepositMutation,
  useLazyGetDepositQrQuery,
  useLazyGetVnPayUrlQuery
} = walletApi;
