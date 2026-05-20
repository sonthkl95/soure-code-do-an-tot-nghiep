export interface SpringPage<T> {
  content: T[];          // Dữ liệu chính nằm ở đây
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;        // Index trang hiện tại (bắt đầu từ 0)
  first: boolean;
  last: boolean;
  empty: boolean;
}

// 5. Wrapper ApiResponse (nếu backend bạn bọc data trong 'result')
export interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}