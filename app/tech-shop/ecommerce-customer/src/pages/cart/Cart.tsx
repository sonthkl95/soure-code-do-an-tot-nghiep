import React from 'react';
import { Link, useNavigate } from 'react-router'; // 'react-router-dom'
import { RiDeleteBin6Line, RiShoppingBag3Line, RiArrowRightLine, RiArrowLeftLine, RiLoader4Line } from "react-icons/ri";
import { toast } from 'react-toastify';

// Import Hooks RTK Query
import { useAddToCartMutation, useGetMyCartQuery, useRemoveFromCartMutation } from '../../features/cart/cart.api';
import { useAppSelector } from '../../store/hook';

const CartPage = () => {
    const navigate = useNavigate();
    const status = useAppSelector((state) => state.auth.status)
    const [addToCart, { isLoading: isUpdating }] = useAddToCartMutation();
    // 1. Lấy dữ liệu giỏ hàng (Tự động fetch khi mount)
    const { data: cart, isLoading, isError, refetch } = useGetMyCartQuery(undefined, {
        skip: status != "authenticated", // Không gọi API nếu chưa đăng nhập
    });
    console.log(cart);

    // 2. Hook xóa sản phẩm
    const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation();

    // Hàm format tiền
    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('vi-VN') + ' ₫';
    };

    // Hàm xử lý xóa
    const handleRemoveItem = async (skuId: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
        try {
            await removeFromCart(skuId).unwrap();
            toast.success("Đã xóa sản phẩm khỏi giỏ");
        } catch (error) {
            console.log(error);

            toast.error("Lỗi khi xóa sản phẩm");
        }
    };
    const handleUpdateQuantity = async (skuId: string, skuCode: string, delta: number) => {
        // delta là 1 (tăng) hoặc -1 (giảm)
        await addToCart({ skuId, skuCode, quantity: delta }).unwrap();
    };
    // --- XỬ LÝ CÁC TRẠNG THÁI LOADING / ERROR / CHƯA LOGIN ---

    if (status != "authenticated") {
        return (
            <div className="container py-5 text-center min-vh-50 d-flex flex-column justify-content-center align-items-center">
                <h3>Bạn chưa đăng nhập</h3>
                <p className="text-muted">Vui lòng đăng nhập để xem giỏ hàng của bạn.</p>
                <button className="btn btn-danger" onClick={() => navigate('/login')}>Đăng nhập ngay</button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container py-5 text-center min-vh-50 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-danger" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="container py-5 text-center">
                <h3 className="text-danger">Có lỗi xảy ra!</h3>
                <p>Không thể tải thông tin giỏ hàng.</p>
                <button className="btn btn-outline-dark" onClick={() => refetch()}>Thử lại</button>
            </div>
        );
    }

    // --- RENDER: GIỎ HÀNG TRỐNG ---
    if (!cart || !cart.items || cart.items.length === 0) {
        return (
            <div className="container py-5 text-center min-vh-50 d-flex flex-column align-items-center justify-content-center">
                <div className="mb-4 p-4 rounded-circle bg-light d-inline-flex">
                    <RiShoppingBag3Line size={48} className="text-secondary" />
                </div>
                <h2 className="fw-bold mb-3">Giỏ hàng trống</h2>
                <p className="text-muted mb-4">
                    Có vẻ như bạn chưa thêm sản phẩm nào vào giỏ hàng. <br />
                    Hãy khám phá các danh mục hàng đầu của chúng tôi.
                </p>
                <Link to="/" className="btn btn-danger btn-lg rounded-pill px-5 d-flex align-items-center gap-2">
                    <RiArrowLeftLine /> Tiếp Tục Mua Sắm
                </Link>
            </div>
        );
    }

    // --- TÍNH TOÁN TIỀN (Backend trả về Subtotal, Frontend tính thuế để hiện thị) ---
    const subTotal = cart.totalPrice;
    const tax = subTotal * 0.08; // Thuế 8% (Giả định)
    const shipping = 0; // Miễn phí
    const total = subTotal + tax + shipping;

    // Kiểm tra xem có sản phẩm nào hết hàng không để disable nút thanh toán
    const hasOutOfStockItem = cart.items.some(item => item.isOutOfStock);

    // --- RENDER: GIỎ HÀNG CÓ SẢN PHẨM ---
    return (
        <div className="container py-5">
            <h3 className="fw-bold mb-4">GIỎ HÀNG CỦA BẠN ({cart.items.length})</h3>

            <div className="row g-4">
                {/* CỘT TRÁI: DANH SÁCH SẢN PHẨM */}
                <div className="col-lg-8">
                    {/* Header Bảng (Ẩn trên mobile) */}
                    <div className="d-none d-md-flex row bg-light py-3 px-2 rounded-top fw-bold text-secondary font-size-sm">
                        <div className="col-6">SẢN PHẨM</div>
                        <div className="col-2 text-center">ĐƠN GIÁ</div>
                        <div className="col-2 text-center">SỐ LƯỢNG</div>
                        <div className="col-2 text-end">TỔNG</div>
                    </div>

                    {/* List Items */}
                    <div className="bg-white border rounded-bottom mb-3">
                        {cart.items.map((item) => (
                            <div key={item.skuId} className={`row align-items-center p-3 border-bottom mx-0 ${item.isOutOfStock ? 'bg-light opacity-75' : ''}`}>

                                {/* 1. Product Info & Options */}
                                <div className="col-12 col-md-6 d-flex gap-3 align-items-center mb-3 mb-md-0">
                                    <div style={{ width: '80px', height: '80px', flexShrink: 0, position: 'relative' }}>
                                        <img
                                            src={item.thumbnail}
                                            alt={item.productName}
                                            className="w-100 h-100 object-fit-cover rounded border"
                                        />
                                        {item.isOutOfStock && (
                                            <div className="position-absolute inset-0 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center text-white small rounded" style={{ top: 0, left: 0, right: 0, bottom: 0 }}>
                                                Hết hàng
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="fw-bold text-dark">{item.productName}</div>

                                        {/* Hiển thị phân loại (Màu sắc, Size...) */}
                                        <div className="text-muted small d-flex flex-wrap gap-2 mt-1">
                                            {item.options.map((opt, idx) => (
                                                <span key={idx} className="badge bg-light text-dark border">
                                                    {opt.groupName}: {opt.label}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Cảnh báo tồn kho */}
                                        {item.isOutOfStock && (
                                            <div className="text-danger small mt-1 fw-bold">
                                                Chỉ còn {item.stock} sản phẩm. Vui lòng giảm số lượng.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 2. Price */}
                                <div className="col-4 col-md-2 text-md-center fw-bold">
                                    {formatCurrency(item.price)}
                                </div>

                                {/* 3. Quantity (Hiện tại chỉ hiển thị, chưa làm chức năng update) */}
                                <div className="col-4 col-md-2 d-flex justify-content-center">
                                    <div className="input-group input-group-sm" style={{ maxWidth: '100px' }}>
                                        <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(item.skuId, item.skuCode, -1)} disabled={item.quantity <= 1}>-</button>
                                        <input
                                            type="text"
                                            className="form-control text-center bg-white"
                                            value={item.quantity}
                                            readOnly
                                        />
                                        <button className="btn btn-outline-secondary" onClick={() => handleUpdateQuantity(item.skuId, item.skuCode, 1)}>+</button>
                                    </div>
                                </div>

                                {/* 4. Total Item Price & Delete */}
                                <div className="col-4 col-md-2 text-end d-flex align-items-center justify-content-end gap-3">
                                    <span className="fw-bold text-danger">
                                        {formatCurrency(item.subTotal)}
                                    </span>
                                    <button
                                        className="btn btn-link text-secondary p-0"
                                        onClick={() => handleRemoveItem(item.skuId)}
                                        disabled={isRemoving}
                                        title="Xóa khỏi giỏ"
                                    >
                                        {isRemoving ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBin6Line size={18} />}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link to="/" className="text-decoration-none text-secondary d-inline-flex align-items-center gap-2">
                        <RiArrowLeftLine /> Tiếp tục mua sắm
                    </Link>
                </div>

                {/* CỘT PHẢI: TỔNG TIỀN */}
                <div className="col-lg-4">
                    <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-body p-4">
                            <h5 className="card-title fw-bold mb-4">TỔNG ĐƠN HÀNG</h5>

                            <div className="d-flex justify-content-between mb-3">
                                <span className="text-muted">Tạm tính</span>
                                <span className="fw-bold">{formatCurrency(subTotal)}</span>
                            </div>

                            <div className="d-flex justify-content-between mb-3">
                                <span className="text-muted">Phí vận chuyển</span>
                                <span className="text-success fw-bold">Miễn Phí</span>
                            </div>

                            <div className="d-flex justify-content-between mb-4">
                                <span className="text-muted">Thuế (8%)</span>
                                <span className="fw-bold">{formatCurrency(tax)}</span>
                            </div>

                            <div className="input-group mb-4">
                                <input type="text" className="form-control" placeholder="Mã giảm giá" />
                                <button className="btn btn-dark" type="button">ÁP DỤNG</button>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <span className="fw-bold">Tổng cộng</span>
                                <span className="fs-4 fw-bold text-danger">{formatCurrency(total)}</span>
                            </div>

                            {/* Disable nút thanh toán nếu có sản phẩm hết hàng */}
                            <button
                                className={`btn w-100 py-3 fw-bold rounded shadow-sm d-flex align-items-center justify-content-center gap-2 ${hasOutOfStockItem ? 'btn-secondary' : 'btn-danger'}`}
                                disabled={hasOutOfStockItem}
                                onClick={() => navigate("/checkout")}
                            >
                                TIẾN HÀNH THANH TOÁN <RiArrowRightLine />
                            </button>

                            {hasOutOfStockItem && (
                                <div className="alert alert-warning mt-3 small text-center mb-0">
                                    Giỏ hàng có sản phẩm hết hàng. Vui lòng xóa hoặc điều chỉnh để tiếp tục.
                                </div>
                            )}

                            <div className="text-center mt-3 text-muted small">
                                <span className="bi bi-shield-lock"></span> Thanh toán an toàn với mã hóa SSL
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;