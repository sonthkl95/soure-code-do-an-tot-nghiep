import { Link } from "react-router";
export default function Forbidden404() {
  return (
    <div className="container py-5">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <h5 className="mb-2">403 — Không tìm thấy trang</h5>
          <p className="text-muted mb-3">Vui lòng liên hệ quản trị viên để biết thêm thông tin chi tiết.</p>
          <div className="d-flex gap-2">
            <Link to="/" className="btn btn-primary btn-sm">Về trang chủ</Link>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => window.history.back()}>
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}