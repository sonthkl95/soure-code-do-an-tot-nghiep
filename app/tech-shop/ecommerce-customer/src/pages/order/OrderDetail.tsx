import { useState } from 'react'; // 1. Thêm useState
import { useGetOrderByNumberQuery } from '../../features/order/order.api';
import { RiArrowLeftLine, RiMapPinLine, RiBankCardLine, RiChatCheckLine } from 'react-icons/ri';
import ReviewModal from './ReviewModal'; // 2. Import Modal đã viết ở bước trước
import { Spinner } from 'react-bootstrap';
import { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from '../../constants/constants';

interface Props {
    orderNo: string;
    onBack: () => void;
}

const OrderDetail = ({ orderNo, onBack }: Props) => {
    const { data: order, isLoading } = useGetOrderByNumberQuery(orderNo);
    const [showReview, setShowReview] = useState(false);

    if (isLoading) return <div className="text-center py-5"><Spinner animation="border" size="sm" /> Đang tải...</div>;
    if (!order) return <div className="text-center py-5">Không tìm thấy thông tin đơn hàng.</div>;

    // Lấy thông tin vietsub
    const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, color: "primary" };
    const paymentInfo = PAYMENT_STATUS_MAP[order.paymentStatus] || { label: order.paymentStatus, color: "secondary" };

    const isDelivered = order.status === 'DELIVERED' || order.status === 'COMPLETED';
    const isAllItemsReviewed = order.items.every(item => item.reviewed);

    return (
        <div className="order-detail-nested">
            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <button onClick={onBack} className="btn btn-light rounded-circle p-2 shadow-sm border">
                    <RiArrowLeftLine size={20} />
                </button>
                <div>
                    <h5 className="fw-bold mb-0">Chi tiết đơn hàng: #{orderNo}</h5>
                    <small className="text-muted">Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</small>
                </div>
            </div>

            <div className="row g-4">
                {/* CỘT TRÁI: SẢN PHẨM */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-4">
                            <h6 className="fw-bold mb-4">Danh sách sản phẩm</h6>
                            {order.items.map((item, idx) => (
                                <div key={idx} className="d-flex gap-3 mb-3 pb-3 border-bottom">
                                    <img src={item.thumbnail} alt="" className="rounded-3 border" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                                    <div className="flex-grow-1">
                                        <div className="fw-bold">{item.productName}</div>
                                        <div className="small text-muted">{item.variantName}</div>
                                        <div className="small">Số lượng: x{item.quantity}</div>
                                    </div>
                                    <div className="text-end">
                                        <div className="fw-bold">{(item.unitPrice * item.quantity).toLocaleString()}đ</div>
                                        <small className="text-muted">{item.unitPrice.toLocaleString()}đ / cái</small>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-4 ms-auto" style={{ maxWidth: '300px' }}>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Tạm tính:</span>
                                    <span>{order.finalAmount?.toLocaleString()}đ</span>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Giảm giá:</span>
                                    <span className="text-success">-0 đ</span>
                                </div>
                                <div className="d-flex justify-content-between border-top pt-2 mt-2 fw-bold text-danger fs-5">
                                    <span>Tổng cộng:</span>
                                    <span>{order.finalAmount.toLocaleString()}đ</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: THÔNG TIN VẬN CHUYỂN & THANH TOÁN */}
                <div className="col-lg-4">
                    {/* Card Trạng thái - Đổi màu theo statusInfo.color */}
                    <div className={`card border-0 shadow-sm rounded-4 mb-4 bg-${statusInfo.color} text-white`}>
                        <div className="card-body p-4">
                            <h6 className="small text-white-50 text-uppercase fw-bold">Trạng thái đơn hàng</h6>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h4 className="fw-bold mb-0">{statusInfo.label}</h4>
                                {isDelivered && (
                                    isAllItemsReviewed ? (
                                        <span className="badge bg-white text-dark"><RiChatCheckLine /> Đã đánh giá</span>
                                    ) : (
                                        <button className="btn btn-warning btn-sm fw-bold" onClick={() => setShowReview(true)}>
                                            Đánh giá ngay
                                        </button>
                                    )
                                )}
                            </div>
                            <hr className="my-3 opacity-25" />
                            <div className="small d-flex justify-content-between">
                                <span>Thanh toán:</span>
                                <strong className={`text-white bg-${paymentInfo.color} px-2 rounded`}>
                                    {paymentInfo.label}
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* Địa chỉ */}
                    <div className="card border-0 shadow-sm rounded-4 mb-4">
                        <div className="card-body p-4">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <RiMapPinLine className="text-primary" /> Thông tin nhận hàng
                            </h6>
                            <div className="small">
                                <p className="mb-1 fw-bold">{order.receiverName}</p>
                                <p className="mb-1">{order.phoneNumber}</p>
                                <p className="mb-0 text-muted">{order.fullAddress}</p>
                            </div>
                        </div>
                    </div>

                    {/* Phương thức thanh toán */}
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-body p-4">
                            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                                <RiBankCardLine className="text-primary" /> Phương thức thanh toán
                            </h6>
                            <div className="small">
                                <strong>{order.paymentMethod}</strong>
                                <p className="text-muted mb-0 mt-1 small">Mọi giao dịch đều được mã hóa an toàn.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ReviewModal show={showReview} onHide={() => setShowReview(false)} orderNo={orderNo} />
        </div>
    );
};

export default OrderDetail;