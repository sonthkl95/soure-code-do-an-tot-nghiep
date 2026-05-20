import { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router';
import { Rating } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import { useGetProductListQuery } from '../../features/product/product.api';
import type { ProductListResponse } from '../../types/product.type';
import {
  clearBrandParam,
  clearRating,
  clearSpecCode,
  extractIdFromSegment,
  getBoolSpec,
  getLastCategoryId,
  getSingleSpec,
  hasSpec,
  setBoolSpec,
  setBrandParam,
  setRating,
  setSingleSpec,
  toggleMulti
} from '../../helpers/product.helper';
import ProductCard from '../../components/ProductCardData';
import { useGetFilterQuery } from '../../features/category/category.api';
import BoolButton from './BoolButton';
import ReactPaginate from 'react-paginate';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import "./product-list.scss";
import { FaArrowUpWideShort, FaChevronRight } from 'react-icons/fa6';
import { useGetWishlistQuery } from '../../features/wishlist/wishlist.api';

const ProductList = () => {
  const { pathname } = useLocation();
  const [sp, setSp] = useSearchParams();

  // --- 1. LẤY DỮ LIỆU TỪ URL (URL LÀ "SOURCE OF TRUTH") ---

  // Category
  const clickedCategoryId = useMemo(
    () => getLastCategoryId(pathname),
    [pathname]
  );
  const isSearchPage = pathname.startsWith('/search') || clickedCategoryId === 'all';
  // Brand
  const brandId = useMemo(
    () => extractIdFromSegment(sp.get("brand") ?? ""),
    [sp]
  );

  // Pagination & Sort
  const page = Number(sp.get("page") ?? 0);
  const size = Number(sp.get("size") ?? 12);
  const sort = sp.get("sort") ?? "newest";
  const q = sp.get("q") ?? undefined;
  const paramMinDiscount = sp.get("minDiscount");
  // Filter Params (Price, Rating, Specs)
  const paramMinPrice = sp.get("minPrice");
  const paramMaxPrice = sp.get("maxPrice");
  const paramRating = sp.get("rating");
  const paramSpecs = useMemo(() => sp.getAll("spec"), [sp]); // Lấy mảng ["screen:oled", "ram:8gb"]

  // --- 2. CHUẨN BỊ ARGUMENTS ĐỂ GỌI API ---
  const args = useMemo(() => {
    const a: any = { page, size, sort };

    // Basic filters
    if (q) a.q = q;
    if (brandId) a.brandIds = [brandId];
    if (clickedCategoryId && !isSearchPage) {
      a.categoryAncestorId = clickedCategoryId;
    }

    // Price
    if (paramMinPrice) a.minPrice = Number(paramMinPrice);
    if (paramMaxPrice) a.maxPrice = Number(paramMaxPrice);

    if (paramRating) {
      // Bên file api bạn check "if (args.rating != null)"
      // Nên ở đây phải gán vào field 'rating', KHÔNG phải 'minRating'
      a.rating = Number(paramRating);
    }
    if (paramMinDiscount) {
      a.minDiscount = Number(paramMinDiscount);
    }
    // --- SỬA LỖI 2: SPECS ---
    // URL đang trả về mảng String: ["SCREEN:OLED", "RAM:16GB"] (ví dụ)
    // Nhưng API đang loop qua object: spec.key, spec.value
    if (paramSpecs.length > 0) {
      a.specs = paramSpecs.map((str) => {
        // Tách chuỗi từ URL ra thành object.
        // Cần đảm bảo ký tự phân cách (ví dụ ':') khớp với lúc bạn set URL
        const parts = str.split(':'); // Hoặc '-' tùy logic helper của bạn

        // Trả về đúng format { key, value }
        return {
          key: parts[0],
          value: parts.length > 1 ? parts[1] : ''
        };
      });
    }

    return a;
  }, [
    page, size, sort, q,
    brandId, clickedCategoryId,
    paramMinPrice, paramMaxPrice, paramRating, paramSpecs,
    isSearchPage, paramMinDiscount
  ]);

  // --- 3. GỌI API ---
  // RTK Query sẽ tự động fetch lại khi `args` thay đổi
  const { data, isLoading, error } = useGetProductListQuery(args, {
    skip: !clickedCategoryId && !q && !paramMinDiscount && !paramMaxPrice && !paramRating && !sp.get("sort"),
  });

  const { data: wishlistItems } = useGetWishlistQuery();
  const wishListIds = useMemo(() => {
    // Dấu ?. và || [] để xử lý trường hợp data chưa tải xong (undefined)
    return wishlistItems?.map((item) => item.productId) || [];
  }, [wishlistItems]);
  const { data: filterData, isLoading: isFilterLoading } =
    useGetFilterQuery(clickedCategoryId!, {
      skip: !clickedCategoryId || isSearchPage,
    });

  // --- 4. LOGIC SLIDER UI ---
  const minBound = data?.priceRange?.min ?? 0;
  const maxBound = data?.priceRange?.max ?? 0;
  const step = Math.max(1, Math.round((maxBound - minBound) / 100));

  // State local cho Slider để mượt mà khi kéo thả
  const [prices, setPrices] = useState<[number, number]>([0, 0]);
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const next = new URLSearchParams(sp);
    next.set("sort", value);
    next.set("page", "0"); // QUAN TRỌNG: Đổi sort thì phải reset về trang đầu
    setSp(next);
  };

  // --- HANDLE PAGE CHANGE ---
  const handlePageClick = (event: { selected: number }) => {
    const next = new URLSearchParams(sp);
    next.set("page", String(event.selected));
    // Scroll lên đầu trang khi chuyển trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSp(next);
  };
  // Sync Slider với URL hoặc Data trả về
  useEffect(() => {
    if (!data?.priceRange) return;

    // Ưu tiên lấy từ URL, nếu không có thì lấy min/max của data
    const currentMin = paramMinPrice ? Number(paramMinPrice) : minBound;
    const currentMax = paramMaxPrice ? Number(paramMaxPrice) : maxBound;

    // Đảm bảo không vượt quá giới hạn
    const safeMin = Math.max(minBound, currentMin);
    const safeMax = Math.min(maxBound, Math.max(currentMax, safeMin)); // max phải >= min

    setPrices([safeMin, safeMax]);
  }, [paramMinPrice, paramMaxPrice, minBound, maxBound]);
  

  // --- 5. RENDER ---
  const sortedFilters = useMemo(() => {
    const arr = filterData?.filters ?? [];
    return [...arr].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [filterData?.filters]);
  if (!clickedCategoryId && !isSearchPage) {
    return <div className='container py-5 text-center'>Đường dẫn không hợp lệ.</div>;
}
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Failed to load</div>;

  const res = data as ProductListResponse;

  const totalItems = res?.total ?? 0;
  const pageCount = Math.ceil(totalItems / size);
  return (
    <div className='product-list'>
      <div className='row mx-0 mb-3'>
        {/* SIDEBAR FILTER */}
        <div className='col-12 col-lg-3 filter px-0'>
          <div className='fs-6 fw-bold filter-top py-3 px-3'>Bộ lọc tìm kiếm</div>
          <div className='py-3 px-3'>

            {/* PRICE FILTER */}
            <div className='filter-price'>
              <div className='filter-title'>Theo giá</div>
              <Slider
                range
                min={minBound}
                max={maxBound}
                step={step}
                value={prices}
                allowCross={false}
                onChange={(vals) => setPrices(vals as [number, number])}
                onChangeComplete={(vals) => {
                  const [min, max] = vals as [number, number];
                  const next = new URLSearchParams(sp);
                  next.set("minPrice", String(min));
                  next.set("maxPrice", String(max));
                  next.set("page", "0");
                  setSp(next, { replace: true });
                }}
              />
              <div className="d-flex justify-content-between mt-2" style={{ fontSize: '0.9rem' }}>
                <span>{prices[0].toLocaleString()}đ</span>
                <span>{prices[1].toLocaleString()}đ</span>
              </div>
            </div>

            {/* RATING FILTER */}
            <div className='filter-rating mb-3'>
              <div className='filter-title'>Theo đánh giá</div>
              {[5, 4, 3, 2, 1].map((r) => {
                const active = Number(paramRating) === r;
                return (
                  <div key={r} className='d-flex align-items-center gap-2 mb-2'>
                    <Rating value={r} readOnly style={{ maxWidth: 100 }} />
                    <button
                      type="button"
                      className={`btn-app rounded btn-app--sm ${!active && "btn-app--outline"}`}
                      onClick={() => setRating(sp, setSp, r)}
                    >
                      {r} sao {r !== 5 ? <FaArrowUpWideShort /> : null}
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                className='btn-app btn-app--outline btn-app--sm rounded'
                disabled={!paramRating}
                onClick={() => clearRating(sp, setSp)}
              >
                Bỏ chọn
              </button>
            </div>

            {/* DYNAMIC SPECS FILTER */}
            {!isFilterLoading && sortedFilters.map((f) => (
              <div key={f.code} style={{ marginBottom: 16 }}>
                <div className='filter-title'>{f.label}</div>

                {/* MULTI_SELECT */}
                {f.dataType === "MULTI_SELECT" && (
                  <div>
                    {f.options.map((opt) => {
                      const checked = hasSpec(sp, f.code, opt.id);
                      return (
                        <label key={opt.id} style={{ display: "block", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleMulti(sp, setSp, f.code, opt.id)}
                            style={{ marginRight: 8 }}
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* SELECT (Radio) */}
                {f.dataType === "SELECT" && (
                  <div>
                    <label style={{ display: "block", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name={f.code}
                        checked={!getSingleSpec(sp, f.code)}
                        onChange={() => setSingleSpec(sp, setSp, f.code, "")}
                        style={{ marginRight: 8 }}
                      />
                      <span>
                        Tất cả
                      </span>
                    </label>
                    {f.options.map((opt) => {
                      const selected = getSingleSpec(sp, f.code) === opt.id;
                      return (
                        <label key={opt.id} style={{ display: "block", cursor: "pointer" }}>
                          <input
                            type="radio"
                            name={f.code}
                            checked={selected}
                            onChange={() => setSingleSpec(sp, setSp, f.code, opt.id)}
                            style={{ marginRight: 8 }}
                          />
                          {opt.label}
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* BOOLEAN */}
                {f.dataType === "BOOLEAN" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <BoolButton
                      active={getBoolSpec(sp, f.code) === true}
                      onClick={() => setBoolSpec(sp, setSp, f.code, true)}
                    >
                      Có
                    </BoolButton>
                    <BoolButton
                      active={getBoolSpec(sp, f.code) === false}
                      onClick={() => setBoolSpec(sp, setSp, f.code, false)}
                    >
                      Không
                    </BoolButton>
                    <button
                      type="button"
                      style={{
                        border: "1px solid #ddd",
                        borderRadius: 10,
                        padding: "6px 10px",
                        background: "transparent",
                      }}
                      onClick={() => clearSpecCode(sp, setSp, f.code)}
                    >
                      Bỏ chọn
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* BRAND FILTER (Hiện trong Sidebar) */}
            {res.brands?.length ? (
              <div className='filter-brand'>
                <div className='filter-title'>Theo hãng</div>
                <div className='d-flex align-items-center gap-2 flex-wrap'>
                  {res.brands.map((b) => {
                    const active = brandId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBrandParam(sp, setSp, b.slug, b.id)}
                        className={`btn-app rounded ${!active ? "btn-app--outline" : ""}`}
                      >
                        <span>{b.name}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => clearBrandParam(sp, setSp)}
                  disabled={!brandId}
                  className={`btn-app rounded btn-app--outline mt-2`}
                >
                  Bỏ chọn hãng
                </button>
              </div>
            ) : null}

          </div>
        </div>

        {/* PRODUCT LIST GRID */}
        <div className='col-12 col-lg-9'>
          <div className="d-flex justify-content-between align-items-center mb-3 bg-white p-3 rounded shadow-sm">
            <span className="fw-bold text-secondary">
              {isLoading ? 'Đang tải...' : `Tìm thấy ${totalItems} sản phẩm`}
            </span>

            <div className="d-flex align-items-center gap-2">
              <label htmlFor="sort-select" className="text-nowrap mb-0" style={{ fontSize: '0.9rem' }}>Sắp xếp theo:</label>
              <select
                id="sort-select"
                className="form-select form-select-sm"
                style={{ width: '180px', cursor: 'pointer' }}
                value={sort}
                onChange={handleSortChange}
              >
                <option value="newest">Mới nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
                <option value="rating_desc">Đánh giá: Cao đến Thấp</option>
                <option value="discount_desc">Giảm giá nhiều</option>
              </select>
            </div>
          </div>
          <div className='d-flex gap-2 flex-wrap align-content-start min-vh-50'>
            {isLoading ? (
              <div className="w-100 text-center py-5">Đang tải sản phẩm...</div>
            ) : res.items && res.items.length > 0 ? (
              <div className="row g-3 w-100"> {/* g-3 tạo khoảng cách giữa các card */}

                {res.items.map((product) => {
                  const isLiked = wishListIds?.includes(product.productId) ?? false;
                  return (
                    // Mobile: 2 cột (col-6), Tablet: 3 cột (md-4), Desktop: 4 hoặc 5 cột (lg-3, xl-20%)
                    <div key={product.productId} className="col-12 col-sm-6 col-md-4 col-lg-4 col-xl-3">
                      <ProductCard
                        product={{
                          ...product,
                          imageUrl: product.thumbnail.url,
                          id: product.productId,
                          isWishlisted: isLiked
                        }}
                      />
                    </div>
                  )
                }

                )}

              </div>
            ) : (
              <div className="w-100 p-5 text-center text-muted border rounded bg-light">
                Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
              </div>
            )}
          </div>
          {pageCount > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <ReactPaginate
                breakLabel="..."
                nextLabel={<FaChevronRight size={14} />}
                onPageChange={handlePageClick}
                pageRangeDisplayed={3} // Số trang hiện ở giữa (vd: ... 4 5 6 ...)
                marginPagesDisplayed={2} // Số trang hiện 2 đầu (vd: 1 2 ... 99 100)
                pageCount={pageCount}
                forcePage={page} // Bắt buộc sync với URL
                renderOnZeroPageCount={null}

                // Bootstrap Classes Integration
                containerClassName="pagination mb-0"
                pageClassName="page-item"
                pageLinkClassName="page-link shadow-none"
                previousClassName="page-item"
                previousLinkClassName="page-link shadow-none"
                nextClassName="page-item"
                nextLinkClassName="page-link shadow-none"
                breakClassName="page-item"
                breakLinkClassName="page-link shadow-none"
                activeClassName="active"
                disabledClassName="disabled"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;