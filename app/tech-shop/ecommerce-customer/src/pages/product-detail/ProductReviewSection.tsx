import { useState } from "react";
import { useGetProductReviewsQuery, useGetReviewSummaryQuery } from "../../features/review/review.api";
import RatingDashboard from "./RatingDashboard";
import ReviewItem from "./ReviewItem";
import Pagination from "./Pagination";

const ProductReviewSection = ({ productId }: { productId: string }) => {
  const [page, setPage] = useState(0);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>(undefined);

  // Lấy thống kê
  const { data: summary } = useGetReviewSummaryQuery(productId);
  console.log({summary});
  
  // Lấy danh sách đánh giá
  const { data: reviewData, isFetching } = useGetProductReviewsQuery({
    productId,
    page,
    rating: ratingFilter
  });
  console.log({reviewData});

  return (
    <div className="review-container">
      {/* 1. Hiển thị RatingSummary (Biểu đồ sao) */}
      {summary && <RatingDashboard summary={summary} onFilterChange={setRatingFilter} />}

      {/* 2. Hiển thị danh sách đánh giá */}
      <div className={isFetching ? 'opacity-50' : ''}>
        {reviewData?.content.map(review => (
          <ReviewItem key={review.id} review={review} />
        ))}
      </div>

      {/* 3. Phân trang */}
      <Pagination 
        current={page} 
        total={reviewData?.page.totalPages ?? 0} 
        onChange={setPage} 
      />
    </div>
  );
};

export default ProductReviewSection