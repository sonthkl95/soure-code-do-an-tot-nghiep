
type OrderStatus = "PENDING" |       // Mới tạo, chờ thanh toán hoặc xác nhận
    "CONFIRMED" |      // Đã xác nhận (Kho đã trừ)
    "SHIPPING"  |     // Đang giao
    "DELIVERED" |     // Giao thành công
    "CANCELLED"  |    // Đã hủy
    "RETURNED"
type PaymentStatus = "UNPAID" |     
    "PAID" |      
    "REFUNDED"  
export interface Order {
    id: string;
    orderNumber: string;
    finalAmount: number;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
}

export type UpdateOrderRequest = {
  status: string;     // OrderStatus
  reason?: string;    // optional
};
export type OrderAddressDTO = {
  id: string;
  contactName: string;
  phone: string;
  addressDetail: string;
  city: string;
  district: string;
  ward: string;
};

export type OrderItemDTO = {
  id: string;
  skuCode: string;
  productId: string;
  productName: string;
  variantName?: string | null;
  productThumbnail?: string | null;
  quantity: number;
  unitPrice: string | number;
  subTotal: string | number;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  userId: string;
  subTotalAmount: string | number;
  discountAmount: string | number;
  finalAmount: string | number;
  status: string; // OrderStatus
  paymentStatus: string; // PaymentStatus
  paymentMethod: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  orderAddress?: OrderAddressDTO | null;
  orderItems: OrderItemDTO[];
};