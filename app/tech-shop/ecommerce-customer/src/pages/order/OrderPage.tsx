import React, { useState } from 'react';
import { useGetMyOrdersQuery } from '../../features/order/order.api';
import { RiShoppingBag3Line, RiArrowRightSLine, RiArrowLeftSLine, RiCalendarLine, RiPriceTag3Line } from 'react-icons/ri';
import { Link } from 'react-router';
import OrderDetail from './OrderDetail';
import { ORDER_STATUS_MAP } from '../../constants/constants';

const MyOrdersPage = () => {
    const [page, setPage] = useState(0);
    const { data, isLoading, isError } = useGetMyOrdersQuery({ page, size: 5 });
    const [selectedOrderNo, setSelectedOrderNo] = useState<string | null>(null);

    if (isLoading) return <div className="text-center py-5">Đang tải lịch sử đơn hàng...</div>;
    if (isError) return <div className="text-center py-5 text-danger">Không thể tải dữ liệu đơn hàng.</div>;

    const renderPagination = () => {
        if (!data || data.page.totalPages <= 1) return null;
        const pages = [];
        for (let i = 0; i < data.page.totalPages; i++) {
            pages.push(
                <li key={i} className={`page-item ${page === i ? 'active' : ''}`}>
                    <button className="page-link shadow-none" onClick={() => setPage(i)}>{i + 1}</button>
                </li>
            );
        }
        return pages;
    };

    return (
        <div className="container py-4">
            {selectedOrderNo ? (
                <OrderDetail
                    orderNo={selectedOrderNo}
                    onBack={() => setSelectedOrderNo(null)}
                />
            ) : (
                <>
                    <h4 className="fw-bold mb-4 d-flex align-items-center gap-2">
                        <RiShoppingBag3Line className="text-primary" /> Lịch sử mua hàng
                    </h4>

                    <div className="order-list d-flex flex-column gap-3 mb-4">
                        {data?.content.length === 0 ? (
                            <div className="text-center py-5 bg-light rounded-4 border border-dashed">
                                <p className="text-muted">Bạn chưa có đơn hàng nào.</p>
                                <Link to="/" className="btn btn-primary rounded-pill px-4">Mua sắm ngay</Link>
                            </div>
                        ) : (
                            data?.content.map((order) => {
                                // Lấy thông tin vietsub từ MAP
                                const status = ORDER_STATUS_MAP[order.status] || { label: order.status, color: "secondary" };
                                
                                return (
                                    <div key={order.orderNumber} className="card border-0 shadow-sm rounded-4 overflow-hidden order-item-card">
                                        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center gap-2">
                                                <span className="fw-bold text-dark">#{order.orderNumber}</span>
                                                <span className="text-muted small">|</span>
                                                <span className="text-muted small d-flex align-items-center gap-1">
                                                    <RiCalendarLine /> {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            {/* Badge trạng thái với màu động */}
                                            <span className={`badge rounded-pill bg-${status.color}-subtle text-${status.color} border border-${status.color} px-3 py-2`}>
                                                {status.label}
                                            </span>
                                        </div>
                                        
                                        <div className="card-body py-4">
                                            <div className="d-flex gap-4 align-items-center">
                                                <div className="position-relative">
                                                    <img 
                                                        src={order.items[0]?.productThumbnail} 
                                                        className="rounded-3 border" 
                                                        style={{ width: '70px', height: '70px', objectFit: 'cover' }} 
                                                        alt="" 
                                                    />
                                                    {order.totalItemsCount > 1 && (
                                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark">
                                                            +{order.totalItemsCount - 1}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-grow-1">
                                                    <h6 className="fw-bold mb-1 text-truncate" style={{ maxWidth: '300px' }}>
                                                        {order.items[0]?.productName}
                                                    </h6>
                                                    <p className="small text-muted mb-0">
                                                        Phương thức: <span className="text-dark fw-medium">{order.paymentMethod}</span>
                                                    </p>
                                                </div>
                                                <div className="text-end">
                                                    <div className="small text-muted mb-1">Tổng cộng</div>
                                                    <div className="fw-bold text-danger fs-5">
                                                        {order.finalAmount.toLocaleString()}đ
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-footer bg-light-subtle border-0 d-flex justify-content-between align-items-center py-3">
                                            <span className="small text-muted italic">
                                                {order.paymentStatus === 'PAID' ? '✅ Đã thanh toán' : '⏳ Chờ thanh toán'}
                                            </span>
                                            <button 
                                                onClick={() => setSelectedOrderNo(order.orderNumber)} 
                                                className="btn btn-outline-dark btn-sm rounded-pill px-4 fw-bold"
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* PAGINATION */}
                    {data && data.page.totalPages > 1 && (
                        <nav className="d-flex justify-content-center mt-5">
                            <ul className="pagination pagination-md shadow-sm rounded-pill overflow-hidden">
                                <li className={`page-item ${page === 0 ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 px-3" onClick={() => setPage(p => Math.max(0, p - 1))}>
                                        <RiArrowLeftSLine />
                                    </button>
                                </li>
                                {renderPagination()}
                                <li className={`page-item ${page >= data.page.totalPages - 1 ? 'disabled' : ''}`}>
                                    <button className="page-link border-0 px-3" onClick={() => setPage(p => Math.min(data.page.totalPages - 1, p + 1))}>
                                        <RiArrowRightSLine />
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
};

export default MyOrdersPage;