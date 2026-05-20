import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { useNavigate } from "react-router";
import { RiLoader4Line, RiCheckboxCircleFill } from "react-icons/ri";
import { useGetOrderByNumberQuery } from "../../features/order/order.api";
import { formatCurrency } from "../../utils/format.utils";

export interface QrModalProps {
    show: boolean;
    onHide: () => void;
    paymentUrl: string;
    orderNo: string;
    amount: number;
    expiresAt: string;
}

const QrPaymentModal = ({ show, onHide, paymentUrl, orderNo, amount, expiresAt }: QrModalProps) => {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        if (!show || !expiresAt) return;

        const calculate = () => {
            const diff = Math.floor((+new Date(expiresAt) - +new Date()) / 1000);
            return diff > 0 ? diff : 0;
        };

        setTimeLeft(calculate());

        const timer = setInterval(() => {
            const remaining = calculate();
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
                onHide(); // Hết giờ thì đóng
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [show, expiresAt, onHide]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        return `${m}:${(s % 60).toString().padStart(2, '0')}`;
    };
    return (
        <Modal show={show} onHide={onHide} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title className="fs-5 fw-bold">Thanh toán mã QR</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center p-4">
                <div className="mb-3 text-muted">
                    Hết hạn sau: <span className="text-danger fw-bold">{formatTime(timeLeft)}</span>
                </div>

                <div className="qr-wrapper border p-3 mb-4 mx-auto" style={{ maxWidth: '280px' }}>
                    <img src={paymentUrl} alt="QR" className="img-fluid" />
                </div>

                <div className="payment-info-box bg-light p-3 rounded text-start">
                    <div className="d-flex justify-content-between mb-2">
                        <span>Số tiền:</span>
                        <span className="fw-bold text-danger">{formatCurrency(amount)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span>Nội dung:</span>
                        <span className="fw-bold">TZORD {orderNo}</span>
                    </div>
                </div>

                <div className="d-flex align-items-center justify-content-center gap-2 text-primary mt-4">
                    <RiLoader4Line className="spin" />
                    <span className="small fw-bold">Đang chờ xác nhận giao dịch...</span>
                </div>
            </Modal.Body>
        </Modal>
    );
};

export default QrPaymentModal;