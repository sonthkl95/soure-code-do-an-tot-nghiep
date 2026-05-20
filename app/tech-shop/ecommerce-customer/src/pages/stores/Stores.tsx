import React from 'react'

const Stores = () => {
    return (
        <div className="container py-5">
            <h2 className="f-section mb-4">Hệ thống cửa hàng TechZone</h2>
            <div className="row g-3">
                <div className="col-12 col-md-6">
                    <div className="d-flex align-items-start p-3 bg-surface border-app--rounded border">
                        <div className="me-3 bg-primary-subtle p-3 rounded">
                            <i className="ri-map-pin-2-fill text-brand"></i>
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <h6 className="f-bold mb-0">TechZone - Chi nhánh Quận 1</h6>
                                <span className="status status--sm status--active">Đang mở cửa</span>
                            </div>
                            <p className="f-body-xs text-muted mb-1">123 Lê Lợi, Phường Bến Thành, Quận 1, TP.HCM</p>
                            <p className="f-body-xs text-muted">Hotline: 1900 1234</p>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="d-flex align-items-start p-3 bg-surface border-app--rounded border opacity-75">
                        <div className="me-3 bg-muted p-3 rounded">
                            <i className="ri-map-pin-2-fill text-secondary"></i>
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2 mb-1">
                                <h6 className="f-bold mb-0 text-muted">TechZone - Chi nhánh Hà Nội</h6>
                                <span className="status status--sm status--inactive">Đã đóng cửa</span>
                            </div>
                            <p className="f-body-xs text-muted mb-1">45 Cầu Giấy, Quận Cầu Giấy, Hà Nội</p>
                            <p className="f-body-xs text-muted">Hotline: 1900 5678</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Stores