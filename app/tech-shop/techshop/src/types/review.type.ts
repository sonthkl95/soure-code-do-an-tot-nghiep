// 1. Định nghĩa các trạng thái của Review
export const ReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ReviewStatus = (typeof ReviewStatus)[keyof typeof ReviewStatus];
// 2. Interface cho một bản ghi Review (Chi tiết hơn bản user)
export interface AdminReview {
  id: string;
  productId: string;
  skuId: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  orderId: string;
  orderItemId: string;
  rating: number;
  comment: string;
  skuAttributes: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

// 3. Interface bọc ngoài cho phản hồi phân trang từ Spring Boot
export interface PaginatedResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}