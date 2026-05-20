import React from 'react';
import { Rating, ThinRoundedStar } from '@smastrom/react-rating';
import type { IReview } from '../../types/review.type';
import { RiCheckboxCircleFill } from 'react-icons/ri';

interface Props {
  review: IReview;
}

const myStarStyles = {
  itemShapes: ThinRoundedStar,
  activeFillColor: '#ffb23f',
  inactiveFillColor: '#ececec'
};

const ReviewItem = ({ review }: Props) => {
  // Format ngày tháng: "20 Jan 2026"
  const formattedDate = new Date(review.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="py-4 border-bottom last-child-border-0">
      <div className="d-flex gap-3">
        {/* Avatar: Nếu không có ảnh thì hiện chữ cái đầu của tên */}
        <div 
          className="rounded-circle d-flex align-items-center justify-content-center bg-secondary-subtle text-secondary fw-bold shadow-sm"
          style={{ width: '48px', height: '48px', flexShrink: 0, overflow: 'hidden' }}
        >
          {review.userAvatar ? (
            <img src={review.userAvatar} alt={review.userName} className="w-100 h-100 object-fit-cover" />
          ) : (
            review.userName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-grow-1">
          {/* Tên và Ngày */}
          <div className="d-flex justify-content-between align-items-start mb-1">
            <div>
              <div className="fw-bold text-dark d-flex align-items-center gap-1">
                {review.userName}
                <RiCheckboxCircleFill className="text-success" title="Đã mua hàng" />
              </div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                Phân loại hàng: <span className="text-secondary">{review.skuAttributes}</span>
              </div>
            </div>
            <div className="text-muted small">{formattedDate}</div>
          </div>

          {/* Sao đánh giá */}
          <div className="mb-2">
            <Rating
              style={{ maxWidth: 80 }}
              value={review.rating}
              readOnly
              itemStyles={myStarStyles}
            />
          </div>

          {/* Nội dung comment */}
          <div className="text-dark-emphasis lh-base" style={{ whiteSpace: 'pre-line' }}>
            {review.comment}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewItem;