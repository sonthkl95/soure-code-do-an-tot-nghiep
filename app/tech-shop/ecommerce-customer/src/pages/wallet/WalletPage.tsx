import React, { useState, useEffect } from "react";
import {
    useGetMyWalletQuery,
    useGetMyTransactionsQuery,
    useLazyGetDepositQrQuery,
    useLazyGetVnPayUrlQuery // Hook đã thêm
} from "../../features/wallet/wallet.api";
import { formatCurrency } from "../../utils/format.utils";
import {
    RiAddCircleFill, RiCheckDoubleFill, RiExchangeDollarLine,
    RiHistoryFill, RiQrCodeLine, RiWallet3Fill,
    RiArrowDownCircleFill,
    RiArrowUpCircleFill,
    RiTimeLine,
    RiFileList3Line,
    RiBankCardLine
} from "react-icons/ri";
import { toast } from "react-toastify";
import "./wallet.scss";
import { useNavigate, useSearchParams } from "react-router";

const WalletPage = () => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState("deposit");
    const [paymentMethod, setPaymentMethod] = useState("vnpay"); // 'vnpay' | 'sepay'
    const [amount, setAmount] = useState("");
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrUrl, setQrUrl] = useState("");
    const [initialBalance, setInitialBalance] = useState(0);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    // --- API HOOKS ---
    const {
        data: wallet,
        isLoading: isWalletLoading,
        refetch: refetchWallet
    } = useGetMyWalletQuery();

    const [page, setPage] = useState(1);
    const pageSize = 10;
    const {
        data: historyPage,
        isFetching: isHistoryFetching,
        refetch: refetchHistory
    } = useGetMyTransactionsQuery(
        { page, size: pageSize },
        { skip: activeTab !== 'history' }
    );

    // Hooks tạo lệnh nạp
    const [triggerGetQr, { isLoading: isGeneratingQr }] = useLazyGetDepositQrQuery();
    const [triggerGetVnPayUrl, { isFetching: isGeneratingVnPay }] = useLazyGetVnPayUrlQuery();
    useEffect(() => {
        const status = searchParams.get("status");

        if (status) {
            if (status === "success") {
                toast.success("Nạp tiền thành công!", {
                    toastId: "deposit-success-toast" // ID duy nhất
                });
                // CHỈ REFETCH KHI QUERY ĐÃ ĐƯỢC KHỞI TẠO
                if (wallet) {
                    refetchWallet();
                }
                // Tương tự với history, check xem dữ liệu đã có chưa
                if (historyPage) {
                    refetchHistory();
                }

                // Sử dụng cách an toàn để chuyển tab (Tránh lỗi Cascading renders)
                setTimeout(() => {
                    setActiveTab("history");
                }, 0);

            } else if (status === "error") {
                toast.error("Thanh toán thất bại.");
            }

            // Xóa param trên URL
            navigate("/my-wallet", { replace: true });
        }
    }, [searchParams, navigate, wallet, historyPage]);
    const transactions = historyPage?.content || [];
    const totalPages = historyPage?.totalPages || 0;

    // --- LOGIC POLLING (Chỉ dùng cho SePay) ---
    useEffect(() => {
        let interval: any;
        if (showQrModal) {
            interval = setInterval(() => {
                refetchWallet();
                refetchHistory();
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [showQrModal, refetchWallet, refetchHistory]);

    useEffect(() => {
        if (showQrModal && wallet) {
            if (wallet.balance > initialBalance) {
                const timer = setTimeout(() => {
                    setShowQrModal(false);
                    toast.success(`Nạp tiền thành công! +${formatCurrency(wallet.balance - initialBalance)}`);
                    setAmount("");
                    setActiveTab("history");
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [wallet, showQrModal, initialBalance]);

    // --- HANDLERS ---
    const handleDeposit = async () => {
        const numAmount = Number(amount);
        if (!amount || numAmount < 10000) {
            toast.warning("Vui lòng nạp tối thiểu 10.000đ");
            return;
        }

        if (paymentMethod === "vnpay") {
            // LUỒNG VNPAY
            try {
                const response = await triggerGetVnPayUrl({ amount: numAmount }).unwrap();
                if (response.url) {
                    toast.info("Đang chuyển hướng sang cổng VNPAY...");
                    window.location.href = response.url;
                }
            } catch (error) {
                toast.error("Lỗi khởi tạo VNPAY, vui lòng thử lại!");
            }
        } else {
            // LUỒNG SEPAY (QR)
            setInitialBalance(wallet?.balance || 0);
            try {
                const url = await triggerGetQr(numAmount).unwrap();
                setQrUrl(url);
                setShowQrModal(true);
            } catch (error) {
                toast.error("Lỗi tạo mã QR, vui lòng thử lại!");
            }
        }
    };

    return (
        <div className="wallet-page-container container py-4">
            <div className="row g-4">
                {/* === CỘT TRÁI: THÔNG TIN VÍ === */}
                <div className="col-lg-4">
                    <div className="card border-0 text-white card-wallet-main mb-3">
                        <div className="card-body p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <span className="opacity-75"><RiWallet3Fill size={24} className="me-2" />TechZone Wallet</span>
                                <span className="badge bg-white" style={{ color: 'var(--brand-500)' }}>{wallet?.status || 'Active'}</span>
                            </div>
                            <h6 className="opacity-75 mb-1">Số dư khả dụng</h6>
                            {isWalletLoading ? (
                                <div className="spinner-border text-white" role="status" />
                            ) : (
                                <h2 className="fw-bold mb-4">{formatCurrency(wallet?.balance)}</h2>
                            )}
                            <div className="d-grid gap-2">
                                <button className="btn btn-light fw-bold"
                                    style={{ color: 'var(--brand-500)' }}
                                    onClick={() => setActiveTab('deposit')}>
                                    <RiAddCircleFill className="me-1" /> Nạp ngay
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="list-group shadow-sm border-0 rounded-3">
                        <button className={`list-group-item list-group-item-action py-3 ${activeTab === 'deposit' ? 'active fw-bold' : ''}`}
                            onClick={() => setActiveTab('deposit')}>
                            <RiExchangeDollarLine size={20} className="me-2" /> Nạp tiền vào ví
                        </button>
                        <button className={`list-group-item list-group-item-action py-3 ${activeTab === 'history' ? 'active fw-bold' : ''}`}
                            onClick={() => setActiveTab('history')}>
                            <RiHistoryFill size={20} className="me-2" /> Lịch sử giao dịch
                        </button>
                    </div>
                </div>

                {/* === CỘT PHẢI: NỘI DUNG CHÍNH === */}
                <div className="col-lg-8">
                    {activeTab === 'deposit' && (
                        <div className="card border-0 shadow-sm h-100 animate__animated animate__fadeIn">
                            <div className="card-body p-4">
                                <h4 className="fw-bold mb-4">Nạp tiền vào ví</h4>

                                <div className="mb-4">
                                    <label className="form-label text-muted fw-bold">Số tiền muốn nạp</label>
                                    <div className="input-group mb-3">
                                        <span className="input-group-text bg-light fw-bold">VND</span>
                                        <input
                                            type="number"
                                            className="form-control form-control-lg fw-bold text-brand fs-2"
                                            placeholder="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                    <div className="d-flex flex-wrap gap-2">
                                        {[50000, 100000, 200000, 500000, 1000000].map((val) => (
                                            <button key={val}
                                                className={`btn btn-sm ${Number(amount) === val ? 'btn-primary-brand' : 'btn-outline-secondary'}`}
                                                onClick={() => setAmount(val.toString())}>
                                                {val / 1000}k
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label text-muted fw-bold mb-3">Chọn phương thức thanh toán</label>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <div className={`p-3 border rounded-3 cursor-pointer d-flex align-items-center ${paymentMethod === 'vnpay' ? 'border-primary' : ''}`}
                                                style={{
                                                    cursor: 'pointer',
                                                    borderColor: paymentMethod === 'vnpay' ? 'var(--brand-500)' : 'var(--neutral-200)',
                                                    backgroundColor: paymentMethod === 'vnpay' ? 'var(--brand-50)' : 'transparent'
                                                }}
                                                onClick={() => setPaymentMethod('vnpay')}>
                                                <RiBankCardLine size={24} className="me-3 text-brand" />
                                                <div className="fw-bold">Cổng VNPAY</div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className={`p-3 border rounded-3 cursor-pointer d-flex align-items-center ${paymentMethod === 'sepay' ? 'border-primary' : ''}`}
                                                style={{
                                                    cursor: 'pointer',
                                                    borderColor: paymentMethod === 'sepay' ? 'var(--brand-500)' : 'var(--neutral-200)',
                                                    backgroundColor: paymentMethod === 'sepay' ? 'var(--brand-50)' : 'transparent'
                                                }}
                                                onClick={() => setPaymentMethod('sepay')}>
                                                <RiQrCodeLine size={24} className="me-3 text-brand" />
                                                <div className="fw-bold">Quét mã QR</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button className="btn btn-primary-brand btn-lg w-100 fw-bold py-3"
                                    onClick={handleDeposit}
                                    disabled={isGeneratingQr || isGeneratingVnPay || !amount}>
                                    {isGeneratingQr || isGeneratingVnPay ? (
                                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                                    ) : (
                                        <RiAddCircleFill className="me-2" size={24} />
                                    )}
                                    Tiếp tục thanh toán
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="history-card p-4 shadow-sm bg-white rounded animate__animated animate__fadeIn">
                            <h5 className="fw-bold mb-4">
                                <RiFileList3Line className="me-2 text-brand" />
                                Lịch sử giao dịch
                            </h5>

                            {isHistoryFetching ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-brand" role="status"></div>
                                    <p className="mt-2 text-muted">Đang tải lịch sử...</p>
                                </div>
                            ) : transactions.length > 0 ? (
                                <>
                                    <div className="table-responsive history-table">
                                        <table className="table table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Mã GD</th>
                                                    <th>Loại</th>
                                                    <th>Số tiền</th>
                                                    <th>Thời gian</th>
                                                    <th>Trạng thái</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map((tx: any) => (
                                                    <tr key={tx.id}>
                                                        <td className="small text-muted">{tx.id.substring(0, 8)}...</td>
                                                        <td>
                                                            {tx.type === 'DEPOSIT' ? (
                                                                <span className="text-success"><RiArrowDownCircleFill className="me-1" /> Nạp tiền</span>
                                                            ) : (
                                                                <span className="text-brand"><RiArrowUpCircleFill className="me-1" /> Thanh toán</span>
                                                            )}
                                                        </td>
                                                        <td className={`fw-bold ${tx.type === 'DEPOSIT' ? 'text-success' : 'text-brand'}`}>
                                                            {tx.type === 'DEPOSIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                                                        </td>
                                                        <td className="small text-muted">
                                                            <RiTimeLine className="me-1" />
                                                            {new Date(tx.createdAt).toLocaleString('vi-VN')}
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${tx.status === 'SUCCESS' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>
                                                                {tx.status === 'SUCCESS' ? 'Thành công' : 'Chờ xử lý'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {totalPages > 1 && (
                                        <div className="d-flex justify-content-center mt-4">
                                            <nav>
                                                <ul className="pagination">
                                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                        <button className="page-link" onClick={() => setPage(p => p - 1)} style={{ color: 'var(--brand-500)' }}>Trước</button>
                                                    </li>
                                                    {[...Array(totalPages)].map((_, i) => (
                                                        <li key={i} className={`page-item ${page === i + 1 ? 'active' : ''}`}>
                                                            <button
                                                                className="page-link"
                                                                onClick={() => setPage(i + 1)}
                                                                style={page === i + 1 ? { backgroundColor: 'var(--brand-500)', borderColor: 'var(--brand-500)' } : { color: 'var(--brand-500)' }}>
                                                                {i + 1}
                                                            </button>
                                                        </li>
                                                    ))}
                                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                                        <button className="page-link" onClick={() => setPage(p => p + 1)} style={{ color: 'var(--brand-500)' }}>Sau</button>
                                                    </li>
                                                </ul>
                                            </nav>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-5">
                                    <RiHistoryFill size={48} className="text-muted mb-3 opacity-25" />
                                    <p className="text-muted">Bạn chưa có giao dịch nào.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL QR */}
            {showQrModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Quét mã thanh toán</h5>
                                <button type="button" className="btn-close" onClick={() => setShowQrModal(false)}></button>
                            </div>
                            <div className="modal-body text-center pb-4">
                                <div className="border p-2 d-inline-block rounded mb-3 bg-white shadow-sm">
                                    <img src={qrUrl} alt="QR" className="img-fluid" style={{ maxWidth: '300px' }} />
                                </div>
                                <h3 className="fw-bold text-brand mb-3">{formatCurrency(amount)}</h3>
                                <div className="alert alert-warning small py-2 d-flex align-items-center justify-content-center">
                                    <div className="spinner-grow spinner-grow-sm text-warning me-2" role="status" />
                                    <span>Hệ thống đang chờ tiền về...</span>
                                </div>
                                <button className="btn btn-success fw-bold w-100" onClick={() => { setShowQrModal(false); refetchWallet(); }}>
                                    <RiCheckDoubleFill className="me-1" /> Tôi đã chuyển khoản xong
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletPage;