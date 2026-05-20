import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  useGetOverviewQuery,
  useGetDailyQuery,
  useGetTopProductsQuery,
} from "../../features/order/order-stats.api";

const formatMoney = (v: number) => (v ?? 0).toLocaleString("vi-VN") + " ₫";
const formatInt = (v: number) => (v ?? 0).toLocaleString("vi-VN");

// yyyy-mm-dd for input[type=date]
const toDateInput = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addDays = (d: Date, days: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
};

const clampRange = (from: string, to: string) => {
  // đảm bảo from <= to
  if (!from || !to) return { from, to };
  return from <= to ? { from, to } : { from: to, to: from };
};

const MoneyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p: any) => p.dataKey === "revenue")?.value ?? 0;
  const totalOrders = payload.find((p: any) => p.dataKey === "totalOrders")?.value ?? 0;

  return (
    <div className="bg-white border rounded shadow-sm p-2">
      <div className="fw-semibold mb-1">{label}</div>
      <div className="small text-muted">Doanh thu: <span className="fw-semibold text-dark">{formatMoney(revenue)}</span></div>
      <div className="small text-muted">Số đơn: <span className="fw-semibold text-dark">{formatInt(totalOrders)}</span></div>
    </div>
  );
};

const Dashboard = () => {
  // default: 30 ngày gần nhất
  const today = useMemo(() => new Date(), []);
  const defaultFrom = useMemo(() => toDateInput(addDays(today, -29)), [today]);
  const defaultTo = useMemo(() => toDateInput(today), [today]);

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const range = useMemo(() => clampRange(from, to), [from, to]);

  const { data: overview, isLoading: loadingOverview, isFetching: fetchingOverview, error: errOverview } =
    useGetOverviewQuery(range);

  const { data: daily, isLoading: loadingDaily, isFetching: fetchingDaily, error: errDaily } =
    useGetDailyQuery(range);

  const { data: topProducts, isLoading: loadingTop, isFetching: fetchingTop, error: errTop } =
    useGetTopProductsQuery({ ...range, limit: 10 });
  console.log(overview);
  
  const loading = loadingOverview || loadingDaily || loadingTop;
  const fetching = fetchingOverview || fetchingDaily || fetchingTop;

const chartData = useMemo(() => {
  return (daily ?? [])
    .filter((d) => d?.statDate) // ✅ tránh undefined
    .map((d) => ({
      ...d,
      label: d.statDate ? d.statDate.slice(5) : "",
    }));
}, [daily]);

  const kpi = overview ?? {
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    revenue: 0,
    grossAmount: 0,
    discountAmount: 0,
    itemsSold: 0,
    codOrders: 0,
    vnpayOrders: 0,
    bankTransferOrders: 0,
  };

  const aov = useMemo(() => {
    const denom = kpi.totalOrders || 0;
    return denom > 0 ? kpi.revenue / denom : 0;
  }, [kpi.totalOrders, kpi.revenue]);

  const paymentSplit = useMemo(() => {
    const total = kpi.codOrders + kpi.vnpayOrders + kpi.bankTransferOrders;
    const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);
    return {
      total,
      codPct: pct(kpi.codOrders),
      vnpayPct: pct(kpi.vnpayOrders),
      bankPct: pct(kpi.bankTransferOrders),
    };
  }, [kpi.codOrders, kpi.vnpayOrders, kpi.bankTransferOrders]);

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
        <div>
          <div className="h4 mb-0">Dashboard đơn hàng</div>
          <div className="text-muted small">
            {fetching ? "Đang cập nhật dữ liệu…" : "Tổng quan doanh thu & đơn hàng theo thời gian."}
          </div>
        </div>

        {/* Date range controls */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <div className="input-group input-group-sm" style={{ width: 170 }}>
            <span className="input-group-text">Từ</span>
            <input
              type="date"
              className="form-control"
              value={range.from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="input-group input-group-sm" style={{ width: 170 }}>
            <span className="input-group-text">Đến</span>
            <input
              type="date"
              className="form-control"
              value={range.to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              setFrom(defaultFrom);
              setTo(defaultTo);
            }}
          >
            30 ngày gần nhất
          </button>
        </div>
      </div>

      {/* Errors */}
      {(errOverview || errDaily || errTop) && (
        <div className="alert alert-danger">
          Không tải được dữ liệu thống kê. Vui lòng kiểm tra API / quyền truy cập.
        </div>
      )}

      {/* KPI Cards */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Doanh thu (DELIVERED)</div>
              <div className="h4 mb-1">{loading ? "—" : formatMoney(kpi.revenue)}</div>
              <div className="small text-muted">
                AOV: <span className="fw-semibold text-dark">{loading ? "—" : formatMoney(aov)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Tổng đơn</div>
              <div className="h4 mb-1">{loading ? "—" : formatInt(kpi.totalOrders)}</div>
              <div className="small text-muted">
                Delivered: <span className="fw-semibold text-success">{formatInt(kpi.deliveredOrders)}</span>{" "}
                • Cancel: <span className="fw-semibold text-danger">{formatInt(kpi.cancelledOrders)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Sản phẩm bán ra</div>
              <div className="h4 mb-1">{loading ? "—" : formatInt(kpi.itemsSold)}</div>
              <div className="small text-muted">
                Gross: <span className="fw-semibold text-dark">{loading ? "—" : formatMoney(kpi.grossAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 col-xl-3">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <div className="text-muted small">Giảm giá</div>
              <div className="h4 mb-1">{loading ? "—" : formatMoney(kpi.discountAmount)}</div>
              <div className="small text-muted">
                COD {paymentSplit.codPct}% • VNPAY {paymentSplit.vnpayPct}% • Bank {paymentSplit.bankPct}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-7">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <div className="fw-semibold">Doanh thu theo ngày</div>
              <div className="text-muted small">{range.from} → {range.to}</div>
            </div>
            <div className="card-body" style={{ height: 320 }}>
              {loadingDaily ? (
                <div className="placeholder-glow">
                  <div className="placeholder col-12" style={{ height: 240 }} />
                </div>
              ) : (chartData.length === 0 ? (
                <div className="text-muted text-center py-5">Không có dữ liệu trong khoảng ngày này.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickMargin={8} />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1_000_000)}M`} />
                    <Tooltip content={<MoneyTooltip />} />
                    <Line type="monotone" dataKey="revenue" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <div className="fw-semibold">Số đơn theo ngày</div>
              <div className="text-muted small">Total orders</div>
            </div>
            <div className="card-body" style={{ height: 320 }}>
              {loadingDaily ? (
                <div className="placeholder-glow">
                  <div className="placeholder col-12" style={{ height: 240 }} />
                </div>
              ) : (chartData.length === 0 ? (
                <div className="text-muted text-center py-5">Không có dữ liệu.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tickMargin={8} />
                    <YAxis allowDecimals={false} />
                    <Tooltip content={<MoneyTooltip />} />
                    <Bar dataKey="totalOrders" />
                  </BarChart>
                </ResponsiveContainer>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="fw-semibold">Top sản phẩm bán chạy</div>
          <div className="text-muted small">Top 10 theo số lượng</div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: 56 }}>#</th>
                <th>Sản phẩm</th>
                <th style={{ width: 140 }}>Product ID</th>
                <th style={{ width: 120 }} className="text-end">Số lượng</th>
                <th style={{ width: 180 }} className="text-end">Doanh thu</th>
              </tr>
            </thead>

            <tbody>
              {loadingTop ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5}>
                      <div className="placeholder-glow">
                        <span className="placeholder col-12" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (topProducts?.length ? (
                topProducts.map((p, idx) => (
                  <tr key={p.productId}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <div className="fw-semibold">{p.productName}</div>
                    </td>
                    <td className="text-muted">{p.productId}</td>
                    <td className="text-end fw-semibold">{formatInt(p.quantity)}</td>
                    <td className="text-end fw-semibold">{formatMoney(p.revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    Không có dữ liệu top products.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card-footer bg-white small text-muted d-flex justify-content-between flex-wrap gap-2">
          <span>Khoảng thời gian: {range.from} → {range.to}</span>
          <span>{fetching ? "Đang refresh…" : "Dữ liệu lấy từ bảng thống kê (stats tables)."}</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
