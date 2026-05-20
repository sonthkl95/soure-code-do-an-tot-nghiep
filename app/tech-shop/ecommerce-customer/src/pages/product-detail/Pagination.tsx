
interface Props {
  current: number; // Trang hiện tại (0-indexed)
  total: number;   // Tổng số trang (totalPages)
  onChange: (page: number) => void;
}

const Pagination = ({ current, total, onChange }: Props) => {
  if (total <= 1) return null; // Không hiện nếu chỉ có 1 trang

  const pages = [];
  for (let i = 0; i < total; i++) {
    pages.push(i);
  }

  return (
    <nav className="d-flex justify-content-center mt-5">
      <ul className="pagination pagination-sm gap-2">
        {/* Nút Previous */}
        <li className={`page-item ${current === 0 ? 'disabled' : ''}`}>
          <button 
            className="page-link rounded-circle border-0 shadow-sm" 
            onClick={() => onChange(current - 1)}
            style={{ width: '36px', height: '36px' }}
          >
            &laquo;
          </button>
        </li>

        {/* Danh sách các số trang */}
        {pages.map((p) => (
          <li key={p} className={`page-item ${current === p ? 'active' : ''}`}>
            <button 
              className={`page-link rounded-circle border-0 shadow-sm fw-bold ${current === p ? 'bg-warning text-white' : 'text-dark'}`}
              onClick={() => onChange(p)}
              style={{ width: '36px', height: '36px' }}
            >
              {p + 1}
            </button>
          </li>
        ))}

        {/* Nút Next */}
        <li className={`page-item ${current === total - 1 ? 'disabled' : ''}`}>
          <button 
            className="page-link rounded-circle border-0 shadow-sm" 
            onClick={() => onChange(current + 1)}
            style={{ width: '36px', height: '36px' }}
          >
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;