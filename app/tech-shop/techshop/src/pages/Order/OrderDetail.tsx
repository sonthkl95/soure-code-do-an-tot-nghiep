import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import { RiArrowLeftLine, RiEditLine } from "react-icons/ri";
import { useGetOrderByIdQuery } from "../../features/order/order.api";
import type { OrderDetail, OrderItemDTO } from "../../types/order.type";

const formatMoney = (v: string | number | null | undefined) => {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  if (Number.isNaN(n)) return "-";
  return n.toLocaleString("vi-VN") + " ₫";
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // fallback nếu backend không ISO chuẩn
  return d.toLocaleString("vi-VN");
};

const statusBadgeClass = (s?: string) => {
  switch (s) {
    case "PENDING":
      return "badge text-bg-warning";
    case "CONFIRMED":
      return "badge text-bg-info";
    case "SHIPPING":
      return "badge text-bg-primary";
    case "DELIVERED":
      return "badge text-bg-success";
    case "CANCELLED":
      return "badge text-bg-danger";
    default:
      return "badge text-bg-secondary";
  }
};

const paymentBadgeClass = (s?: string) => {
  switch (s) {
    case "UNPAID":
      return "badge text-bg-warning";
    case "PAID":
      return "badge text-bg-success";
    case "REFUNDED":
      return "badge text-bg-secondary";
    default:
      return "badge text-bg-secondary";
  }
};

const Thumb = ({ url, alt }: { url?: string | null; alt: string }) => {
  if (!url) {
    return (
      <div
        className="bg-light border rounded d-flex align-items-center justify-content-center"
        style={{ width: 56, height: 56 }}
        title="No image"
      >
        <span className="text-muted small">N/A</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      className="rounded border object-fit-cover"
      style={{ width: 56, height: 56 }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
};

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isFetching, isError } = useGetOrderByIdQuery(id!, {
    skip: !id,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const order: OrderDetail | undefined = data;

  const items = order?.orderItems ?? [];

  const totalQty = useMemo(
    () => items.reduce((acc, it) => acc + (it.quantity ?? 0), 0),
    [items]
  );

  if (isError) {
    toast.error("Không tải được chi tiết đơn hàng.");
  }

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn-app btn-outline-secondary btn-sm btn-app--outline"
            onClick={() => navigate(-1)}
          >
            <RiArrowLeftLine /> Quay lại
          </button>
          <div>
            <div className="h5 mb-0">Chi tiết đơn hàng</div>
            <div className="text-muted small">
              {isFetching ? "Đang tải…" : "Xem thông tin đơn hàng và các sản phẩm."}
            </div>
          </div>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="placeholder-glow">
                  <div className="placeholder col-6 mb-2" />
                  <div className="placeholder col-12 mb-2" />
                  <div className="placeholder col-10" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="placeholder-glow">
                  <div className="placeholder col-8 mb-2" />
                  <div className="placeholder col-12 mb-2" />
                  <div className="placeholder col-9" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && order && (
        <div className="row g-3">
          {/* Left: Items */}
          <div className="col-12 col-lg-8">
            <div className="card shadow-sm">
              <div className="card-header bg-white d-flex align-items-center justify-content-between">
                <div className="fw-semibold">
                  Sản phẩm ({items.length}) • SL: {totalQty}
                </div>
                <div className="text-muted small">
                  Mã đơn: <span className="fw-semibold">{order.orderNumber}</span>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: 72 }}>Ảnh</th>
                      <th>Sản phẩm</th>
                      <th style={{ width: 140 }}>Đơn giá</th>
                      <th style={{ width: 90 }} className="text-center">
                        SL
                      </th>
                      <th style={{ width: 160 }} className="text-end">
                        Thành tiền
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it: OrderItemDTO) => (
                      <tr key={it.id}>
                        <td>
                          <Thumb url={it.productThumbnail} alt={it.productName} />
                        </td>
                        <td>
                          <div className="fw-semibold">{it.productName}</div>
                          <div className="text-muted small">
                            SKU: {it.skuCode} • PID: {it.productId}
                            {it.variantName ? ` • ${it.variantName}` : ""}
                          </div>
                        </td>
                        <td>{formatMoney(it.unitPrice)}</td>
                        <td className="text-center">
                          <span className="badge text-bg-light border">
                            {it.quantity}
                          </span>
                        </td>
                        <td className="text-end fw-semibold">
                          {formatMoney(it.subTotal)}
                        </td>
                      </tr>
                    ))}

                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          Không có sản phẩm trong đơn.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="card-footer bg-white">
                <div className="d-flex flex-column gap-2 ms-auto" style={{ maxWidth: 360 }}>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Tạm tính</span>
                    <span className="fw-semibold">{formatMoney(order.subTotalAmount)}</span>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Giảm giá</span>
                    <span className="fw-semibold text-danger">
                      - {formatMoney(order.discountAmount)}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between">
                    <span className="fw-semibold">Tổng thanh toán</span>
                    <span className="fw-bold fs-5">{formatMoney(order.finalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order info + Address */}
          <div className="col-12 col-lg-4">
            {/* Order summary */}
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white fw-semibold">Thông tin đơn</div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Mã đơn</span>
                  <span className="fw-semibold">{order.orderNumber}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Khách hàng</span>
                  <span className="fw-semibold">{order.userId}</span>
                </div>

                <div className="d-flex justify-content-between mb-2 align-items-center">
                  <span className="text-muted">Trạng thái</span>
                  <span className={statusBadgeClass(order.status)}>{order.status}</span>
                </div>

                <div className="d-flex justify-content-between mb-2 align-items-center">
                  <span className="text-muted">Thanh toán</span>
                  <span className={paymentBadgeClass(order.paymentStatus)}>
                    {order.paymentStatus}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Phương thức</span>
                  <span className="fw-semibold">{order.paymentMethod}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Tạo lúc</span>
                  <span className="fw-semibold">{formatDateTime(order.createdAt)}</span>
                </div>

                <div className="d-flex justify-content-between">
                  <span className="text-muted">Cập nhật</span>
                  <span className="fw-semibold">{formatDateTime(order.updatedAt)}</span>
                </div>

                {order.note && (
                  <>
                    <hr />
                    <div className="text-muted small mb-1">Ghi chú</div>
                    <div className="bg-light border rounded p-2 small">{order.note}</div>
                  </>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="card shadow-sm">
              <div className="card-header bg-white fw-semibold">Địa chỉ giao hàng</div>
              <div className="card-body">
                {order.orderAddress ? (
                  <>
                    <div className="fw-semibold">{order.orderAddress.contactName}</div>
                    <div className="text-muted small mb-2">{order.orderAddress.phone}</div>

                    <div className="bg-light border rounded p-2">
                      <div className="small">
                        {order.orderAddress.addressDetail}
                      </div>
                      <div className="small text-muted">
                        {order.orderAddress.ward}, {order.orderAddress.district},{" "}
                        {order.orderAddress.city}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted">Chưa có địa chỉ.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !order && (
        <div className="card shadow-sm">
          <div className="card-body text-center text-muted py-5">
            Không tìm thấy đơn hàng.
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
