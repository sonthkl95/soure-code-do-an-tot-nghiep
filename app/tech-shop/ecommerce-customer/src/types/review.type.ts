// Interface cho từng item đánh giá
export interface ReviewRequest {
  productId: string;
  skuId: string;
  orderId: string;
  orderItemId: string; // Khóa chính để check trùng
  rating: number;      // 1-5
  comment: string;
  skuAttributes: string; // Snapshot: "Màu đen - 64GB"
}

// Interface cho phản hồi từ Server
export interface ReviewResponse {
  message: string;
  status: number;
}

// Interface mở rộng cho việc hiển thị (nếu cần lấy review về)
export interface ProductReview {
  id: string;
  userId: string;
  rating: number;
  comment: string;
  skuAttributes: string;
  createdAt: string;
}

export interface ReviewFormData {
  reviews: ReviewRequest[];
}


export interface IReview {
  id: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  skuAttributes: string;
  createdAt: string;
}

export interface IRatingSummary {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: Record<number, number>; // {1: 0, 2: 5, ...}
}

export interface IReviewResponse {
  content: IReview[];
  page: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }
}
