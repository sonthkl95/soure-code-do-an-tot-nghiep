import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import {
    RiTruckLine, RiWallet3Line, RiQrCodeLine,
    RiBankCardLine, RiAddLine, RiArrowLeftLine,
    RiInformationLine,
    RiMapPinRangeLine
} from "react-icons/ri";
import { toast } from "react-toastify";

// Hooks từ API của bạn
import { cartApi, useGetMyCartQuery } from "../../features/cart/cart.api";
import { useCreateUserAddressMutation, useGetMyAddressesQuery, useGetProvincesQuery, useLazyGetDistrictsQuery, useLazyGetWardsQuery } from "../../features/address/address.api";
import { useGetMyWalletQuery } from "../../features/wallet/wallet.api";
import { formatCurrency } from "../../utils/format.utils";
import { Spinner, Badge, Modal, Form, Button } from "react-bootstrap";
import "./checkout.scss";
import type { IUserAddressRequest } from "../../types/location.type";
import { FiCheck } from "react-icons/fi";
import { useCreateOrderMutation } from "../../features/order/order.api";
import { useAppDispatch } from "../../store/hook";
import QrPaymentModal, { type QrModalProps } from "./QrPaymentModal";

interface ICheckoutForm {
    addressId: string;
    paymentMethod: "COD" | "WALLET" | "BANK" | "VNPAY";
    note: string
}

const CheckoutPage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [isProcessing, setIsProcessing] = useState(false);

    // ---- 1. LẤY DỮ LIỆU TỪ CÁC SERVICE ----
    const { data: cart, isLoading: isCartLoading } = useGetMyCartQuery();
    const { data: addresses = [], isLoading: isAddrLoading } = useGetMyAddressesQuery();
    const { data: wallet } = useGetMyWalletQuery();
    const { data: provinces = [] } = useGetProvincesQuery();

    const [triggerDistricts, { data: districts = [] }] = useLazyGetDistrictsQuery();
    const [triggerWards, { data: wards = [] }] = useLazyGetWardsQuery();
    const [createAddress] = useCreateUserAddressMutation();
    const [createOrder] = useCreateOrderMutation();

    // ---- 2. STATE QUẢN LÝ MODAL ----
    const [showAddrModal, setShowAddrModal] = useState(false);
    const [isSubmittingAddr, setIsSubmittingAddr] = useState(false);
    const [qrModalInfo, setQrModalInfo] = useState({
        show: false,
        paymentUrl: "",
        orderNo: "",
        amount: 0,
        expiresAt: "",
    });

    // ---- 3. SETUP FORM CHÍNH ----
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ICheckoutForm>({
        defaultValues: { paymentMethod: "COD" }
    });

    const watchFields = watch();

    useEffect(() => {
        if (addresses.length > 0 && !watchFields.addressId) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            setValue("addressId", defaultAddr.id);
        }
    }, [addresses, setValue, watchFields.addressId]);

    // ---- 4. TÍNH TOÁN CHI PHÍ ----
    const subTotal = cart?.totalPrice || 0;
    const tax = subTotal * 0.08;
    const total = subTotal + tax;
    const hasStockError = cart?.items.some(item => item.isOutOfStock);
    const isWalletBalanceEnough = wallet ? wallet.balance >= total : false;

    // ---- 5. XỬ LÝ THANH TOÁN (SSE) ----
    const watchPaymentSuccess = (orderNumber: string) => {
        // Chỉ lắng nghe sự kiện THÀNH CÔNG sau khi đã có mã QR
        const eventSource = new EventSource(
            `http://localhost:8081/api/orders/customer-order/sse/${orderNumber}`,
            { withCredentials: true }
        );

        eventSource.addEventListener("PAYMENT_SUCCESS", () => {
            toast.success("Thanh toán thành công!");
            eventSource.close();
            setQrModalInfo(prev => ({ ...prev, show: false }));
            navigate(`/order-success?orderNo=${orderNumber}&status=success`);
        });

        eventSource.onerror = () => {
            eventSource.close();
        };
    };

    // ---- 6. SUBMIT ĐẶT HÀNG ----
    const onOrderSubmit = async (data: ICheckoutForm) => {
        if (hasStockError) {
            toast.error("Giỏ hàng có sản phẩm hết hàng!");
            return;
        }

        try {
            setIsProcessing(true);

            // 1. Gọi API tạo đơn - Bây giờ nhận về đầy đủ paymentUrl
            const response = await createOrder(data).unwrap();
            const { orderNumber, paymentMethod, paymentUrl } = response;

            // 2. Xóa giỏ hàng local để tránh đặt trùng
            dispatch(
                cartApi.util.updateQueryData('getMyCart', undefined, (draft) => {
                    if (draft) { draft.items = []; draft.totalPrice = 0; }
                })
            );

            // 3. Điều phối theo phương thức thanh toán
            switch (paymentMethod) {
                case "VNPAY":
                    if (paymentUrl) window.location.href = paymentUrl;
                    break;

                case "BANK":
                    setQrModalInfo({
                        show: true,
                        paymentUrl: paymentUrl || "",
                        orderNo: orderNumber,
                        amount: total,
                        // Nếu backend chưa trả expiresAt, ta giả định 15 phút từ bây giờ
                        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(), 
                    });
                    // Bắt đầu "hóng" tin nhắn thành công qua SSE
                    watchPaymentSuccess(orderNumber);
                    break;

                default: // COD hoặc WALLET thành công ngay
                    toast.success("Đặt hàng thành công!");
                    navigate(`/order-success?orderNo=${orderNumber}&status=success`);
            }

        } catch (err: any) {
            toast.error(err?.data?.message || "Đặt hàng thất bại, vui lòng thử lại.");
        } finally {
            setIsProcessing(false);
        }
    };

    // ---- 7. LOGIC THÊM ĐỊA CHỈ MỚI ----
    const { register: regAddr, handleSubmit: handleAddrSubmit, setValue: setAddrValue, reset: resetAddr, formState: { errors: addrErrors } } = useForm<IUserAddressRequest>({
        defaultValues: { type: "HOME", isDefault: false }
    });

    const onProvinceChange = (e: any) => {
        const code = e.target.value;
        setAddrValue("districtCode", ""); setAddrValue("wardCode", "");
        if (code) triggerDistricts(code);
    };

    const onDistrictChange = (e: any) => {
        const code = e.target.value;
        setAddrValue("wardCode", "");
        if (code) triggerWards(code);
    };

    const onSubmitNewAddress = async (data: IUserAddressRequest) => {
        setIsSubmittingAddr(true);
        try {
            await createAddress(data).unwrap();
            toast.success("Thêm địa chỉ thành công!");
            setShowAddrModal(false);
            resetAddr();
        } catch (err) {
            toast.error("Không thể thêm địa chỉ.");
        } finally {
            setIsSubmittingAddr(false);
        }
    };

    if (isCartLoading || isAddrLoading) return <div className="p-5 text-center"><Spinner animation="border" variant="danger" /></div>;

    return (
        <div className="checkout-page container py-5">
            <form onSubmit={handleSubmit(onOrderSubmit)}>
                <div className="row g-4">

                    {/* === CỘT TRÁI: ĐỊA CHỈ & THANH TOÁN === */}
                    <div className="col-lg-8">

                        {/* 1. ĐỊA CHỈ GIAO HÀNG */}
                        <section className="checkout-section mb-4">
                            <h5 className="section-title">
                                <span className="step-number">1</span> Địa Chỉ Giao Hàng
                            </h5>

                            <div className="address-selection-list">
                                {addresses.length === 0 ? (
                                    <div className="alert alert-info">Bạn chưa có địa chỉ nào. <Link to="/my-addresses">Thêm ngay</Link></div>
                                ) : (
                                    addresses.map((addr) => (
                                        <label key={addr.id} className={`address-item-card ${watchFields.addressId === addr.id ? "active" : ""}`}>
                                            <div className="form-check">
                                                <input
                                                    type="radio"
                                                    value={addr.id}
                                                    className="form-check-input"
                                                    {...register("addressId", { required: true })}
                                                />
                                            </div>
                                            <div className="address-info">
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="receiver-name">{addr.receiverName}</span>
                                                    {addr.isDefault && <Badge className="addr-badge-default">MẶC ĐỊNH</Badge>}
                                                </div>
                                                <p className="address-text">{addr.detailAddress}, {addr.wardName}, {addr.districtName}, {addr.provinceName}</p>
                                                <p className="address-phone">SĐT: {addr.phone}</p>
                                            </div>
                                        </label>
                                    ))
                                )}
                                <button type="button" className="add-new-address-btn mt-2 w-100" onClick={() => setShowAddrModal(true)}>
                                    <RiAddLine /> Thêm Địa Chỉ Mới
                                </button>
                            </div>
                        </section>

                        {/* 2. PHƯƠNG THỨC THANH TOÁN */}
                        <section className="checkout-section">
                            <h5 className="section-title">
                                <span className="step-number">2</span> Phương Thức Thanh Toán
                            </h5>

                            <div className="payment-methods-grid">
                                {/* COD */}
                                <label className={`payment-card ${watchFields.paymentMethod === 'COD' ? 'active' : ''}`}>
                                    <input type="radio" value="COD" className="form-check-input" {...register("paymentMethod")} />
                                    <div className="payment-icon cod"><RiTruckLine /></div>
                                    <div className="payment-meta">
                                        <div className="payment-name">Thanh toán khi nhận hàng (COD)</div>
                                        <div className="payment-desc">Trả tiền mặt khi Shipper giao hàng</div>
                                    </div>
                                </label>

                                {/* TECHZONE WALLET */}
                                <label className={`payment-card ${watchFields.paymentMethod === 'WALLET' ? 'active' : ''}`}>
                                    <input type="radio" value="WALLET" className="form-check-input" {...register("paymentMethod")} />
                                    <div className="payment-icon wallet"><RiWallet3Line /></div>
                                    <div className="payment-meta">
                                        <div className="payment-name">Ví TechZone</div>
                                        <div className="payment-desc">
                                            Số dư: <span className={isWalletBalanceEnough ? "text-success fw-bold" : "text-danger fw-bold"}>
                                                {formatCurrency(wallet?.balance || 0)}
                                            </span>
                                        </div>
                                    </div>
                                </label>

                                {/* QR CODE */}
                                <label className={`payment-card ${watchFields.paymentMethod === 'BANK' ? 'active' : ''}`}>
                                    <input type="radio" value="BANK" className="form-check-input" {...register("paymentMethod")} />
                                    <div className="payment-icon qr"><RiQrCodeLine /></div>
                                    <div className="payment-meta">
                                        <div className="payment-name">Quét mã QR (SePay)</div>
                                        <div className="payment-desc">Chuyển khoản ngân hàng xác nhận tức thì</div>
                                    </div>
                                </label>

                                {/* VNPAY */}
                                <label className={`payment-card ${watchFields.paymentMethod === 'VNPAY' ? 'active' : ''}`}>
                                    <input type="radio" value="VNPAY" className="form-check-input" {...register("paymentMethod")} />
                                    <div className="payment-icon vnpay"><RiBankCardLine /></div>
                                    <div className="payment-meta">
                                        <div className="payment-name">Cổng VNPAY</div>
                                        <div className="payment-desc">Thẻ ATM nội địa / Visa / Mastercard</div>
                                    </div>
                                </label>
                            </div>
                        </section>
                        <section className="checkout-section mt-4">
                            <h5 className="section-title">
                                <span className="step-number">3</span> Ghi Chú Đơn Hàng
                            </h5>
                            <div className="note-container">
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    placeholder="Ví dụ: Giao hàng giờ hành chính, gọi trước khi giao..."
                                    {...register("note")}
                                ></textarea>
                                <p className="small text-muted mt-2">
                                    <RiInformationLine /> Lưu ý này sẽ được gửi đến đơn vị vận chuyển.
                                </p>
                            </div>
                        </section>
                    </div>

                    {/* === CỘT PHẢI: TÓM TẮT ĐƠN HÀNG === */}
                    <div className="col-lg-4">
                        <div className="order-summary-card shadow-sm sticky-top" style={{ top: '120px' }}>
                            <h5 className="fw-bold mb-4">ĐƠN HÀNG</h5>

                            <div className="order-items-list mb-4">
                                {cart?.items.map(item => (
                                    <div key={item.skuId} className={`order-item d-flex gap-3 mb-3 ${item.isOutOfStock ? 'opacity-50' : ''}`}>
                                        <div className="position-relative">
                                            <img src={item.thumbnail} alt={item.productName} className="item-img" />
                                            {item.isOutOfStock && <span className="item-stock-tag">Hết hàng</span>}
                                        </div>
                                        <div className="item-info">
                                            <div className="item-name text-truncate-2">{item.productName}</div>
                                            <div className="d-flex justify-content-between w-100 gap-2 mt-1">
                                                <span className="small text-muted">SL: {item.quantity}</span>
                                                <span>*</span>
                                                <span className="fw-bold small">{formatCurrency(item.price)}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {hasStockError && (
                                <div className="alert alert-danger py-2 small mb-3">
                                    <RiInformationLine className="me-1" /> Có sản phẩm không đủ tồn kho
                                </div>
                            )}

                            <hr />
                            <div className="price-breakdown mt-4">
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-muted">Tạm tính</span>
                                    <span>{formatCurrency(subTotal)}</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3">
                                    <span className="text-muted">Thuế (8%)</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                    <span className="fw-bold fs-5">Tổng cộng</span>
                                    <span className="total-price text-brand fs-3 fw-bold">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-danger w-100 mt-4 py-3 fw-bold"
                                disabled={isProcessing || hasStockError || (watchFields.paymentMethod === 'WALLET' && !isWalletBalanceEnough)}
                            >
                                {isProcessing ? <><Spinner size="sm" /> ĐANG XỬ LÝ...</> : "ĐẶT HÀNG NGAY"}
                            </button>

                            <Link to="/cart" className="back-to-cart d-flex align-items-center justify-content-center mt-3 text-muted text-decoration-none small">
                                <RiArrowLeftLine className="me-1" /> Quay lại giỏ hàng
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
            <QrPaymentModal
                {...qrModalInfo}
                onHide={() => setQrModalInfo(prev => ({ ...prev, show: false }))}

            />
            <Modal
                show={showAddrModal}
                onHide={() => !isSubmittingAddr && setShowAddrModal(false)}
                centered
                size="lg"
                dialogClassName="addr-modal"
            >
                <Modal.Header className="addr-modal__header" closeButton={!isSubmittingAddr}>
                    <div className="addr-modal__header-left">
                        <div className="addr-modal__icon"><RiMapPinRangeLine /></div>
                        <div className="addr-modal__titles">
                            <div className="addr-modal__title">Thêm địa chỉ giao hàng mới</div>
                            <div className="addr-modal__subtitle">Thông tin này sẽ được lưu vào sổ địa chỉ của bạn</div>
                        </div>
                    </div>
                </Modal.Header>

                <Modal.Body className="addr-modal__body">
                    <Form className="form-app" onSubmit={handleAddrSubmit(onSubmitNewAddress)}>
                        <div className="row g-3">
                            {/* Loại địa chỉ */}
                            <div className="col-12 mb-2">
                                <div className="type-row">
                                    <Form.Check
                                        inline type="radio" label="Nhà riêng" value="HOME"
                                        {...regAddr("type")} id="type-home" defaultChecked
                                    />
                                    <Form.Check
                                        inline type="radio" label="Văn phòng" value="WORK"
                                        {...regAddr("type")} id="type-work"
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <Form.Label>Tên người nhận</Form.Label>
                                <Form.Control
                                    className={addrErrors.receiverName ? "is-invalid" : ""}
                                    {...regAddr("receiverName", { required: "Bắt buộc" })}
                                    placeholder="Nhập họ tên"
                                />
                            </div>

                            <div className="col-md-6">
                                <Form.Label>Số điện thoại</Form.Label>
                                <Form.Control
                                    className={addrErrors.phone ? "is-invalid" : ""}
                                    {...regAddr("phone", { required: "Bắt buộc" })}
                                    placeholder="Nhập SĐT"
                                />
                            </div>

                            <div className="col-md-4">
                                <Form.Label>Tỉnh/Thành</Form.Label>
                                <Form.Select
                                    className={addrErrors.provinceCode ? "is-invalid" : ""}
                                    {...regAddr("provinceCode", { required: true, onChange: onProvinceChange })}
                                >
                                    <option value="">Chọn Tỉnh</option>
                                    {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                </Form.Select>
                            </div>

                            <div className="col-md-4">
                                <Form.Label>Quận/Huyện</Form.Label>
                                <Form.Select
                                    className={addrErrors.districtCode ? "is-invalid" : ""}
                                    {...regAddr("districtCode", { required: true, onChange: onDistrictChange })}
                                >
                                    <option value="">Chọn Quận</option>
                                    {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                </Form.Select>
                            </div>

                            <div className="col-md-4">
                                <Form.Label>Phường/Xã</Form.Label>
                                <Form.Select
                                    className={addrErrors.wardCode ? "is-invalid" : ""}
                                    {...regAddr("wardCode", { required: true })}
                                >
                                    <option value="">Chọn Xã</option>
                                    {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                </Form.Select>
                            </div>

                            <div className="col-12">
                                <Form.Label>Địa chỉ chi tiết</Form.Label>
                                <Form.Control
                                    as="textarea" rows={2}
                                    {...regAddr("detailAddress", { required: true })}
                                    placeholder="Số nhà, tên đường..."
                                />
                            </div>
                        </div>
                    </Form>
                </Modal.Body>

                <Modal.Footer className="addr-modal__footer">
                    <Button variant="light" onClick={() => setShowAddrModal(false)} disabled={isSubmittingAddr}>
                        Hủy bỏ
                    </Button>
                    <Button
                        className="btn-add"
                        onClick={handleAddrSubmit(onSubmitNewAddress)}
                        disabled={isSubmittingAddr}
                    >
                        {isSubmittingAddr ? <Spinner size="sm" /> : <><FiCheck className="me-2" /> Lưu địa chỉ</>}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CheckoutPage;