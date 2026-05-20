/**
 * Format số thành tiền tệ Việt Nam
 * Ví dụ: 1000000 => 1.000.000 ₫
 */
export const formatCurrency = (value: number | string | undefined | null): string => {
  if (!value) return "0 ₫";
  
  const amount = Number(value);
  
  // Kiểm tra nếu không phải số hợp lệ
  if (isNaN(amount)) return "0 ₫";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0, // VND không dùng số lẻ thập phân
  }).format(amount);
};

/**
 * Format ngày tháng (Bonus thêm nếu bạn cần dùng cho ngày tạo/cập nhật)
 * Ví dụ: 2024-01-01 => 01/01/2024
 */
export const formatDate = (dateString: string | Date | undefined): string => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};