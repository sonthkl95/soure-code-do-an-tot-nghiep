export interface IOrderCreateRequest {
    addressId: string;
    paymentMethod: "COD" | "WALLET" | "BANK" | "VNPAY";
    note?: string;
}

export interface IOrderResponse {
    orderNumber: string;
    paymentUrl?: string;     // URL của VNPAY hoặc QR Code
    paymentMethod: string;
}


export interface IOrderItemResponse {
    orderItemId: string;
    productId: string;
    skuCode: string;
    skuId: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    thumbnail: string;
    reviewed: boolean
}

export interface IOrderDetailsResponse {
    orderId: string;
    orderNumber: string;
    createdAt: string;
    status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED' | 'RETURNED' | 'OUT_OF_STOCK';
    finalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    receiverName: string;
    phoneNumber: string;
    fullAddress: string;
    items: IOrderItemResponse[];
}


export interface ICustomerOrderItemResponse {
    productName: string;
    variantName: string;
    productThumbnail: string;
    quantity: number;
    unitPrice: number;
    subTotal: number;
}
export interface ICustomerOrderResponse {
    orderId: string;
    orderNumber: string;
    finalAmount: number;
    status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
    paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
    paymentMethod: 'COD' | 'VNPAY' | 'WALLET' | 'SEPAY';
    createdAt: string;
    items: ICustomerOrderItemResponse[];
    totalItemsCount: number;
}

export interface IPaginatedResponse<T> {
    content: T[];
    page: {
        totalElements: number;
        totalPages: number;
        size: number;
        number: number; // trang hiện tại
    }
}