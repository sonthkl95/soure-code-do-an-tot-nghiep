import { useMemo } from "react";

type PaginationProps = {
  page: number;           // 1-based
  totalPages: number;
  onChange: (page: number) => void;
  totalElement?: number,
  variant?: "basic" | "simple";
  showRowsPerPage?: boolean;
  rowsPerPage?: number;
  rowsPerPageOptions?: number[];
  onRowsPerPageChange?: (v: number) => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function getPages(page: number, total: number, variant: "basic" | "simple") {
  if (total <= 7 || variant === "simple") {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  // basic with dots like: 1 2 3 ... next
  const pages: (number | "dots")[] = [];
  const add = (p: number | "dots") => pages.push(p);

  add(1);
  if (page > 3) add("dots");

  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  for (let p = start; p <= end; p++) add(p);

  if (page < total - 2) add("dots");
  add(total);

  return pages;
}

export default function Pagination({
  page,
  totalPages,
  totalElement = 0,
  onChange,
  variant = "basic",
  showRowsPerPage = false,
  rowsPerPage = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
  onRowsPerPageChange,
}: Readonly<PaginationProps>) {
  const current = clamp(page, 1, Math.max(1, totalPages));
  const pages = useMemo(() => getPages(current, totalPages, variant), [current, totalPages, variant]);

  return (
    <div className="pagination-app">
      <div className="pagination-app__left">
        {showRowsPerPage && (
          <>
            <span className="pg__label">Số bản ghi mỗi trang</span>
            <select
              className="pg__select"
              value={rowsPerPage}
              onChange={(e) => onRowsPerPageChange?.(Number(e.target.value))}
            >
              {rowsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {totalElement > 0 && (<span className="pg__label">của <span className="fw-bold">{totalElement}</span> bản ghi</span>)}
          </>
        )}
      </div>

      <div className="pagination-app__right">
        <div className="pg">
          <button
            className="pg__btn"
            disabled={current <= 1}
            onClick={() => onChange(current - 1)}
          >
            ‹ <span className="ms-1">Trước</span>
          </button>

          {pages.map((p, idx) =>
            p === "dots" ? (
              <span key={`d-${idx}`} className="pg__dots">
                …
              </span>
            ) : (
              <button
                key={p}
                className={`pg__btn ${p === current ? "is-active pg__btn--outline" : ""}`}
                onClick={() => onChange(p)}
              >
                {p}
              </button>
            )
          )}

          <button
            className="pg__btn"
            disabled={current >= totalPages}
            onClick={() => onChange(current + 1)}
          >
            <span className="me-1">Sau</span> ›
          </button>
        </div>
      </div>
    </div>
  );
}
