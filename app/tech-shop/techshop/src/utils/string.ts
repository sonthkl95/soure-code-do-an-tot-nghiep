export const hasText = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

export const slugify = (s: string) => {
  return (
    s
      .trim()
      .toLowerCase()
      // chuẩn hoá unicode, tách dấu ra khỏi chữ
      .normalize("NFD")
      // xoá toàn bộ dấu (combining marks)
      .replaceAll(/[\u0300-\u036f]/g, "")
      // xử lý riêng tiếng Việt
      .replaceAll(/đ/g, "d")
      .replaceAll(/Đ/g, "d")
      // thay mọi cụm ký tự không phải a-z0-9 thành "-"
      .replaceAll(/[^a-z0-9]+/g, "-")
      // bỏ "-" ở đầu/cuối
      .replaceAll(/(^-|-$)/g, "")
  );
};
