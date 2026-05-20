import React from 'react';
import { Rating, ThinRoundedStar } from '@smastrom/react-rating';
import type { IRatingSummary } from '../../types/review.type';

interface Props {
  summary: IRatingSummary;
  onFilterChange: (rating: number | undefined) => void;
  activeFilter?: number;
}

const myStarStyles = {
  itemShapes: ThinRoundedStar,
  activeFillColor: '#ffb23f',
  inactiveFillColor: '#ececec'
};

const RatingDashboard = ({ summary, onFilterChange, activeFilter }: Props) => {
  const { averageRating, totalReviews, ratingBreakdown } = summary;

  return (
    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-light">
      <div className="row align-items-center">
        {/* Cột trái: Điểm trung bình */}
        <div className="col-md-4 text-center border-end">
          <h1 className="display-4 fw-bold text-warning mb-0">{averageRating}</h1>
          <div className="d-flex justify-content-center my-2">
            <Rating
              style={{ maxWidth: 120 }}
              value={averageRating}
              readOnly
              itemStyles={myStarStyles}
            />
          </div>
          <p className="text-muted mb-0">{totalReviews.toLocaleString()} đánh giá</p>
        </div>

        {/* Cột phải: Biểu đồ thanh (Breakdown) */}
        <div className="col-md-8 ps-md-5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingBreakdown[star] || 0;
            // Tính phần trăm để vẽ thanh Progress Bar
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            const isActive = activeFilter === star;

            return (
              <div 
                key={star} 
                className={`d-flex align-items-center mb-2 p-1 rounded-2 cursor-pointer transition-all ${isActive ? 'bg-white shadow-sm' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => onFilterChange(isActive ? undefined : star)}
              >
                <div className="small fw-bold text-nowrap" style={{ width: '50px' }}>
                  {star} sao
                </div>
                
                <div className="progress flex-grow-1 mx-3" style={{ height: '8px' }}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{ width: `${percentage}%`, borderRadius: '4px' }}
                  ></div>
                </div>
                
                <div className="small text-muted text-end" style={{ width: '40px' }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bộ lọc nhanh (Optional) */}
      <div className="d-flex gap-2 mt-4 flex-wrap">
        <button 
          className={`btn btn-sm rounded-pill px-3 ${activeFilter === undefined ? 'btn-warning' : 'btn-outline-secondary'}`}
          onClick={() => onFilterChange(undefined)}
        >
          Tất cả
        </button>
        {[5, 4, 3, 2, 1].map(star => (
          <button 
            key={star}
            className={`btn btn-sm rounded-pill px-3 ${activeFilter === star ? 'btn-warning' : 'btn-outline-secondary'}`}
            onClick={() => onFilterChange(star)}
          >
            {star} Sao ({ratingBreakdown[star] || 0})
          </button>
        ))}
      </div>
    </div>
  );
};

export default RatingDashboard;