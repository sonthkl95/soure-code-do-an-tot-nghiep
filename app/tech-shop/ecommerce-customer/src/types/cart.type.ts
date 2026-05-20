export interface CartOption {
  groupName: string; // VD: "Màu sắc"
  label: string; // VD: "Đen"
}

// Khớp với CartItemDto bên Java
export interface CartItem {
  skuId: string;
  productName: string;
  productId: string;
  skuCode: string;
  skuName: string;       // "iPhone 17 - Đen - 256GB"
  thumbnail: string;
  price: number;
  quantity: number;
  stock: number;         // Tồn kho thực tế (lấy từ Inventory)
  subTotal: number;
  options: CartOption[]; // List các biến thể
  isOutOfStock: boolean; // Cờ báo lỗi hết hàng
  isPriceChanged: boolean;
}

// Khớp với CartDto bên Java
export interface CartResponse {
  id: number;
  totalPrice: number;
  items: CartItem[];
}