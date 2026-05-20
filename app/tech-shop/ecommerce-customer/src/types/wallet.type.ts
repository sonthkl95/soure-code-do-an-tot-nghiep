export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'PAYMENT' | 'REFUND';
export type TransactionStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

export interface WalletResponse {
  walletId: string;
  balance: number;
  currency: string;
  status: string;
}

// 3. DTO từng dòng Giao dịch
export interface TransactionDto {
  id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  createdAt: string;
}


export interface VnpayUrlResponse {
    message: string,
    url: string,
    status: string;
}
