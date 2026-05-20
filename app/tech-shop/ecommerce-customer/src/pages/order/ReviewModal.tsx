import React, { useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { RiStarFill } from 'react-icons/ri';
import { useGetOrderByNumberQuery } from '../../features/order/order.api';
import { useSubmitBatchReviewsMutation } from '../../features/review/review.api';
import type { ReviewFormData } from '../../types/review.type';
import { Rating, ThinRoundedStar } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
interface Props {
  show: boolean;
  onHide: () => void;
  orderNo: string;
}
const myStarStyles = {
  itemShapes: ThinRoundedStar,
  activeFillColor: '#ffb23f',
  inactiveFillColor: '#ececec'
};
const ReviewModal = ({ show, onHide, orderNo }: Props) => {
  const { data: order } = useGetOrderByNumberQuery(orderNo);
  const [submitBatch] = useSubmitBatchReviewsMutation();

  // 1. Khởi tạo React Hook Form
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ReviewFormData>({
    defaultValues: { reviews: [] }
  });

  // 2. Sử dụng useFieldArray để quản lý danh sách sản phẩm đánh giá
  const { fields } = useFieldArray({ control, name: "reviews" });

  // 3. Reset form khi dữ liệu order về hoặc khi mở modal
  useEffect(() => {
    if (order && show) {
      const initialReviews = order.items
      .filter(item => !item.reviewed)
      .map((item) => ({
        productId: item.productId,
        skuId: item.skuId,
        orderId: order.orderId,
        orderItemId: item.orderItemId,
        rating: 5,
        comment: '',
        skuAttributes: item.variantName
      }));
      
      reset({ reviews: initialReviews });
    }
  }, [order, show, reset]);

  const onSubmit = async (data: ReviewFormData) => {
    try {
      await submitBatch(data.reviews).unwrap();
      alert("Đánh giá thành công!");
      onHide();
    } catch (err: any) {
      alert(err.data || "Lỗi hệ thống");
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold fs-5">Đánh giá sản phẩm</Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* Áp dụng class .form-app từ SCSS của bạn */}
        <form id="review-form" className="form-app" onSubmit={handleSubmit(onSubmit)}>
          {fields.map((field, index) => (
            <div key={field.id} className="mb-5 pb-4 border-bottom last-child-border-0">
              
              {/* Header sản phẩm */}
              <div className="d-flex gap-3 mb-4">
                <img 
                  src={(order?.items[index] as any)?.thumbnail} 
                  className="rounded-3 shadow-sm" 
                  style={{ width: '64px', height: '64px', objectFit: 'cover' }} 
                  alt="" 
                />
                <div>
                  <div className="fw-bold text-dark">{(order?.items[index] as any)?.productName}</div>
                  <div className="form-text mt-0">{(order?.items[index] as any)?.variantName}</div>
                </div>
              </div>

              {/* Rating Section */}
              <div className="mb-3">
                <label className="form-label d-block">Chất lượng sản phẩm</label>
                <Controller
                  name={`reviews.${index}.rating`}
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <Rating
                      style={{ maxWidth: 180 }} // Giới hạn kích thước sao
                      value={value}
                      onChange={onChange}
                      itemStyles={myStarStyles}
                      isRequired
                    />
                  )}
                />
              </div>

              {/* Comment Section - Sử dụng style textarea từ SCSS */}
              <div className="mb-2">
                <label className="form-label">Cảm nhận của bạn</label>
                <Controller
                  name={`reviews.${index}.comment`}
                  control={control}
                  rules={{ required: "Vui lòng nhập nội dung đánh giá" }}
                  render={({ field, fieldState }) => (
                    <>
                      <textarea
                        {...field}
                        className={`form-control ${fieldState.invalid ? 'is-invalid' : ''}`}
                        placeholder="Sản phẩm tuyệt vời, tôi rất ưng ý..."
                      />
                      {fieldState.error && (
                        <div className="form-message-error mt-1">
                          {fieldState.error.message}
                        </div>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
          ))}
        </form>
      </Modal.Body>

      <Modal.Footer className="border-0">
        <button type="button" className="btn-app btn-app--outline rounded fw-bold" onClick={onHide}>Hủy</button>
        <button 
          type="submit" 
          form="review-form" 
          className="btn-app rounded fw-bold px-4"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang xử lý...' : 'Gửi đánh giá'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default ReviewModal;