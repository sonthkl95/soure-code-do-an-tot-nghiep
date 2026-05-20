export type OrderStatsOverview = {
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;

  revenue: number; // nếu BE trả string thì đổi thành string | number
  grossAmount: number;
  discountAmount: number;

  itemsSold: number;

  codOrders: number;
  vnpayOrders: number;
  bankTransferOrders: number;
};

export type OrderDailyStats = {
  statDate: string; // "YYYY-MM-DD"
  totalOrders: number;
  revenue: number;
};

export type TopProductStats = {
  productId: string;
  productName: string;
  quantity: number;
  revenue: number;
};
