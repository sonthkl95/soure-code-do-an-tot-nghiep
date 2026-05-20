import React from "react";
import { Link, useSearchParams } from "react-router";
import {
    RiCheckboxCircleFill, RiFileList3Line, RiShoppingBagLine,
    RiArrowRightSLine, RiCloseCircleFill, RiInformationLine
} from "react-icons/ri";
import { useGetOrderByNumberQuery } from "../../features/order/order.api";
import { formatCurrency } from "../../utils/format.utils";
import { Spinner } from "react-bootstrap";
import "./order-success.scss";

const OrderSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const orderNo = searchParams.get("orderNo");
    const statusParam = searchParams.get("status"); // 'success' hoặc 'fail' từ redirect

    const { data: order, isLoading } = useGetOrderByNumberQuery(orderNo || "");

    // 1. Trạng thái Loading
    if (isLoading) {
        return (
            <div className="order-success-page d-flex flex-column align-items-center justify-content-center py-5">
                <Spinner animation="border" variant="danger" />
                <p className="mt-3 text-muted">Đang lấy thông tin đơn hàng...</p>
            </div>
        );
    }

    // 2. Kiểm tra nếu thanh toán thất bại (Dựa vào URL hoặc Status thực tế của đơn)
    const isFailed = statusParam === "fail" || order?.status === "CANCELLED" || order?.status === "EXPIRED";

    return (
        <div className="order-success-page container py-5">
            <div className="success-card shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
                
                {/* ICON & TIÊU ĐỀ */}
                <div className={`text-center mb-4 ${isFailed ? 'text-danger' : 'text-success'}`}>
                    {isFailed ? (
                        <>
                            <RiCloseCircleFill size={80} />
                            <h2 className="fw-bold mt-3">Thanh toán không thành công</h2>
                            <p className="text-muted">Đơn hàng của bạn đã bị hủy hoặc gặp sự cố khi thanh toán.</p>
                        </>
                    ) : (
                        <>
                            <RiCheckboxCircleFill size={80} />
                            <h2 className="fw-bold mt-3">Đặt hàng thành công!</h2>
                            <p className="text-muted">Cảm ơn bạn đã tin tưởng TechZone. Đơn hàng đang được xử lý.</p>
                        </>
                    )}
                </div>

                <hr />

                {/* THÔNG TIN CHI TIẾT ĐƠN HÀNG */}
                <div className="order-details-box p-3 bg-light rounded mb-4">
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Mã đơn hàng:</span>
                        <strong className="text-dark">{orderNo}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Phương thức:</span>
                        <span className="fw-medium">{order?.paymentMethod}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted">Tổng thanh toán:</span>
                        <strong className="text-danger">{formatCurrency(order?.totalPrice || 0)}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span className="text-muted">Trạng thái:</span>
                        <span className={`badge ${isFailed ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                            {order?.status}
                        </span>
                    </div>
                </div>

                {/* THÔNG BÁO NHẮC NHỞ */}
                {!isFailed && (
                    <div className="alert alert-info d-flex align-items-start gap-2 small">
                        <RiInformationLine className="mt-1 flex-shrink-0" />
                        <div>
                            Bạn sẽ nhận được email xác nhận đơn hàng kèm hóa đơn điện tử trong ít phút tới.
                        </div>
                    </div>
                )}

                {/* NÚT ĐIỀU HƯỚNG */}
                <div className="action-buttons d-flex flex-column gap-2 mt-4">
                    <Link to={`/my-orders/${orderNo}`} className="btn btn-dark w-100 py-2 d-flex align-items-center justify-content-center gap-2">
                        <RiFileList3Line /> Chi tiết đơn hàng
                    </Link>
                    
                    <div className="d-flex gap-2">
                        <Link to="/" className="btn btn-outline-dark flex-grow-1 py-2 d-flex align-items-center justify-content-center gap-2">
                            <RiShoppingBagLine /> Tiếp tục mua sắm
                        </Link>
                        {isFailed && (
                            <Link to="/cart" className="btn btn-primary-brand flex-grow-1 py-2">
                                Thử lại ngay
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage;