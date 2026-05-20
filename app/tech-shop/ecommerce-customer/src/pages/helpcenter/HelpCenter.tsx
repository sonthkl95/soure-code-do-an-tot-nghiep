
const HelpCenter = () => {
    return (
        <div className="container py-5">
            <h2 className="f-section mb-4">Trung tâm trợ giúp</h2>
            <div className="row g-4">
                <div className="col-md-4">
                    <div className="card border-app--rounded p-4 h-100 bg-surface">
                        <h5 className="f-bold mb-3">Mua hàng & Thanh toán</h5>
                        <ul className="list-unstyled f-body-sm text-muted d-flex flex-column gap-2">
                            <li>Làm thế nào để đặt hàng?</li>
                            <li>Các phương thức thanh toán hỗ trợ</li>
                            <li>Xử lý lỗi thanh toán ví TechZone</li>
                        </ul>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-app--rounded p-4 h-100 bg-surface">
                        <h5 className="f-bold mb-3">Giao hàng & Đổi trả</h5>
                        <ul className="list-unstyled f-body-sm text-muted d-flex flex-column gap-2">
                            <li>Chính sách vận chuyển toàn quốc</li>
                            <li>Quy trình đổi trả trong 7 ngày</li>
                            <li>Kiểm tra tình trạng vận chuyển</li>
                        </ul>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-app--rounded p-4 h-100 bg-surface">
                        <h5 className="f-bold mb-3">Tài khoản & Bảo mật</h5>
                        <ul className="list-unstyled f-body-sm text-muted d-flex flex-column gap-2">
                            <li>Quên mật khẩu/Khóa tài khoản</li>
                            <li>Xác thực OTP qua Email</li>
                            <li>Quản lý sổ địa chỉ</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HelpCenter