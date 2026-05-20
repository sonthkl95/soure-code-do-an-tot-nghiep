// Mapping Trạng thái đơn hàng (OrderStatus)
export const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
    CREATED: { label: "Mới khởi tạo", color: "secondary" },
    RESERVED: { label: "Đã giữ hàng", color: "info" },
    AWAITING_PAYMENT: { label: "Chờ thanh toán", color: "warning" },
    PAID: { label: "Đã thanh toán", color: "primary" },
    CONFIRMED: { label: "Đã xác nhận", color: "primary" },
    SHIPPING: { label: "Đang giao hàng", color: "info" },
    DELIVERED: { label: "Đã giao hàng", color: "success" },
    COMPLETED: { label: "Hoàn tất", color: "success" },
    CANCELLED: { label: "Đã hủy", color: "danger" },
    EXPIRED: { label: "Hết hạn", color: "danger" },
    RETURNED: { label: "Đã trả hàng", color: "dark" },
    OUT_OF_STOCK: { label: "Hết hàng", color: "danger" },
};

// Mapping Trạng thái thanh toán (PaymentStatus)
export const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
    INIT: { label: "Thanh toán khi nhận hàng", color: "secondary" },
    PENDING: { label: "Đang xử lý", color: "warning" },
    SUCCEEDED: { label: "Thành công", color: "success" },
    FAILED: { label: "Thất bại", color: "danger" },
    REFUNDED: { label: "Đã hoàn tiền", color: "dark" },
};