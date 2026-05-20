export const formatCurrency = (amount?: number | string | null): string => {
  // 1. Kiểm tra an toàn: Nếu null/undefined hoặc không phải số thì trả về 0đ
  if (amount === undefined || amount === null || amount === "") {
    return "0 ₫";
  }

  const numericAmount = Number(amount);

  if (isNaN(numericAmount)) {
    return "0 ₫";
  }

  // 2. Sử dụng Intl.NumberFormat để format chuẩn vi-VN
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0, // Tiền Việt không dùng số thập phân (hào/xu)
  }).format(numericAmount);
};