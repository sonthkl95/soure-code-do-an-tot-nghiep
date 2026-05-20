import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
    useQueryStates,
    parseAsInteger,
    parseAsString,
} from "nuqs";
import type { Column } from '../../types/table.type';
import Pagination from '../../components/common/Pagination';
import { Rating } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import DataTable from '../../components/common/DataTable';
import { RiCheckDoubleFill, RiIndeterminateCircleFill, RiInformation2Line } from 'react-icons/ri';
import { FilterIndicator } from "../../components/common/FilterIndicator ";
import { SortIndicator } from "../../components/common/SortIndicator ";
import { Link, useNavigate } from 'react-router';
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";
import { ReviewStatus, type AdminReview, type PaginatedResponse } from "../../types/review.type";
import { useGetAdminReviewsQuery, useUpdateReviewStatusMutation } from "../../features/review/review.api";
const SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_SIZE = 10;
const normalizeSize = (raw: number) =>
    (SIZE_OPTIONS as readonly number[]).includes(raw) ? raw : DEFAULT_SIZE;
interface OPTION_STATUS {
    value: ReviewStatus,
    label: string
}
interface OPTION_STAR {
    value: number,
    label: string
}
const STATUS_OPTIONS: OPTION_STATUS[] = [
    { value: ReviewStatus.APPROVED, label: "Đã duyệt" },
    { value: ReviewStatus.PENDING, label: "Chờ duyệt" },
    { value: ReviewStatus.REJECTED, label: "Từ chối" },
];
const STAR_OPTIONS: OPTION_STAR[] = [
    { value: 1, label: "1 sao" },
    { value: 2, label: "2 sao" },
    { value: 3, label: "3 sao" },
    { value: 4, label: "4 sao" },
    { value: 5, label: "5 sao" },
];
const contentStatus = {
    [ReviewStatus.PENDING]: {
        message: "Chờ duyệt",
        class: "status status--sm status--inactive"
    },
    [ReviewStatus.REJECTED]: {
        message: "Từ chối",
        class: "status status--sm status--error"
    },
    [ReviewStatus.APPROVED]: {
        message: "Đã duyệt",
        class: "status status--sm status--active"
    },
}
const ReviewManagement = () => {
    const [query, setQuery] = useQueryStates({
        page: parseAsInteger.withDefault(1),
        size: parseAsInteger.withDefault(DEFAULT_SIZE),
        q: parseAsString.withDefault(""),
        status: parseAsString.withDefault(""),
        rating: parseAsInteger.withDefault(0),
        productId: parseAsString.withDefault("")
    });
    const [keywordInput, setKeywordInput] = useState(query.q);
    const [statusInput, setStatusInput] = useState(query.status);
    const [ratingInput, setRatingInput] = useState(query.rating);
    const uiPage = Math.max(1, query.page);
    const size = normalizeSize(query.size);
    const page = uiPage - 1; // API 0-based
    useEffect(() => {
        if (query.size !== size) setQuery({ size, page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.size, size]);
    useEffect(() => {
        setKeywordInput(query.q);
        setStatusInput(query.status);
        setRatingInput(query.rating);
    }, [query.q, query.status, query.rating]);

    const applySearch = () => {
        setQuery({
            q: keywordInput || null, // null để xóa param trên URL nếu rỗng
            status: statusInput || null,
            rating: ratingInput || null,
            page: 1 // Luôn về trang 1 khi tìm kiếm mới
        });
    };
    const { data, isLoading, isFetching } = useGetAdminReviewsQuery({
        status: query.status,
        rating: query.rating,
        productId: query.productId,
        page: 0
    })
    const [updateReview] = useUpdateReviewStatusMutation();
    const rows: AdminReview[] = data?.content ?? [];
    const totalPages = Math.max(
        1,
        Math.ceil(((data as PaginatedResponse<AdminReview>)?.totalElements ?? 0) / size)
    );
    useEffect(() => {
        if (uiPage > totalPages) setQuery({ page: totalPages });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages]);
    const columns = useMemo<Column<AdminReview>[]>(() =>
        [
            { key: "customer", title: "Khách hàng", strong: true, render: (r) => r.userName },
            { key: "product", title: "Sản phẩm", strong: true, render: (r) => r.productId },
            { key: "rating", title: "Đánh giá", strong: true, render: (r) => r.rating },
            { key: "order", title: "Đơn hàng", strong: true, render: (r) => r.orderId },
            { key: "createdAt", title: "Ngày tạo", strong: true, render: (r) => r.createdAt },
            { key: "status", title: "Trạng thái", strong: true, render: (r) => (<div className={contentStatus[r.status].class}>{contentStatus[r.status].message}</div>) },

        ]
        , []);
    const statusValue = STATUS_OPTIONS.filter((o) => statusInput == o.value)
    const starValue = STAR_OPTIONS.filter((o) => ratingInput == o.value)
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const toggleRow = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };
    const toggleAll = (idsOnPage: string[], nextChecked: boolean) => {
        setSelectedIds((prev) => {
            const set = new Set(prev);
            if (nextChecked) idsOnPage.forEach((id) => set.add(id));
            else idsOnPage.forEach((id) => set.delete(id));
            return Array.from(set);
        });
    };
    const [isShowModal, setIsShowModal] = useState<boolean>(false)
    const [review, setReview] = useState<AdminReview | null>(null)
    const hasPendingChanges =
        keywordInput !== query.q || JSON.stringify(starValue) !== JSON.stringify(query.status) || Number(starValue) != query.rating
    const navigate = useNavigate();
    const onHide = () => {
        setIsShowModal(false);
        setReview(null);
    }
    return (
        <div>
            <div className="container-fluid py-3 d-grid gap-3">
                {/* Search */}
                <div className="table-card">
                    <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
                        <div className="table-card__title form-app mb-0 d-flex flex-row align-items-center gap-2 flex-wrap">
                            {/* keyword */}
                            <input
                                className="form-control form-control-sm"
                                style={{ width: 280 }}
                                placeholder="Tìm kiếm quyền..."
                                value={keywordInput}
                                onChange={(e) => setKeywordInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") applySearch();
                                }}
                            />
                            <button
                                className="btn-app btn-app--sm btn-app--default"
                                onClick={applySearch}
                                disabled={!hasPendingChanges}
                                title={!hasPendingChanges ? "Không có thay đổi" : "Áp dụng tìm kiếm"}
                            >
                                Tìm kiếm
                            </button>

                            {/* multi filter: field */}
                            <div style={{ minWidth: 260 }}>
                                <Select
                                    isClearable
                                    placeholder="Tìm theo trạng thái"
                                    options={STATUS_OPTIONS}
                                    value={statusValue}
                                    onChange={(vals) => {
                                        const next = (vals as OPTION_STATUS | null)?.value ?? "";
                                        setStatusInput(next); // ✅ chỉ đổi draft
                                    }}
                                    components={{
                                        DropdownIndicator: FilterIndicator,
                                        IndicatorSeparator: null,
                                    }}
                                />
                            </div>

                            {/* sort */}
                            <div style={{ minWidth: 220 }}>
                                <Select
                                    isClearable
                                    placeholder="Tìm theo đánh giá"
                                    options={STAR_OPTIONS}
                                    value={starValue}
                                    onChange={(val) => {
                                        const v = (val as OPTION_STAR | null)?.value ?? 0;
                                        setRatingInput(v);
                                    }}
                                    components={{
                                        DropdownIndicator: SortIndicator,
                                        IndicatorSeparator: null,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <Link to="create" className="btn-app btn-app--sm btn-app--default">
                                Thêm thương hiệu
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <DataTable<AdminReview>
                    title="Danh sách thuộc tính"
                    description={isFetching ? "Đang tải…" : "Quản lí thuộc tính"}
                    columns={columns}
                    rows={rows}
                    loading={isLoading}
                    emptyText="Không tìm thấy bản ghi nào."
                    selection={{
                        enabled: true,
                        getRowId: (r) => r.id,
                        selectedIds,
                        onToggleRow: toggleRow,
                        onToggleAll: toggleAll,
                        // disabled: (r) => r.status === "INACTIVE" // optional
                    }}
                    actions={{
                        width: 320,
                        title: "Thao tác",
                        items: [
                            { key: "view", label: <RiInformation2Line />, onClick: (r) => {
                                setReview(r);
                                setIsShowModal(true)
                            } },
                            { key: "accept", visible: (r) => r.status == ReviewStatus.PENDING, label: <RiCheckDoubleFill />, onClick: (r) => updateReview({id: r.id, status: ReviewStatus.APPROVED}) },
                            { key: "reject", visible: (r) => r.status == ReviewStatus.PENDING, label: <RiIndeterminateCircleFill />, onClick: (r) => updateReview({id: r.id, status: ReviewStatus.REJECTED}) },
                        ],
                    }}
                />

                {/* Pagination: UI is 1-based, API is 0-based */}
                <div className="table-card">
                    <Pagination
                        page={uiPage}
                        totalPages={totalPages}
                        onChange={(nextUiPage) => setQuery({ page: nextUiPage })}
                        variant="basic"
                        totalElement={data?.totalElements}
                        showRowsPerPage
                        rowsPerPage={size}
                        rowsPerPageOptions={[...SIZE_OPTIONS]}
                        onRowsPerPageChange={(v) => setQuery({ size: v, page: 1 })}
                    />
                </div>

                {/* Selected summary (optional) */}
                {selectedIds.length > 0 && (
                    <div className="table-card">
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="fw-semibold">
                                Đã chọn: {selectedIds.length}
                            </div>
                            <button
                                className="action-btn action-btn--danger"
                                type="button"
                                onClick={() => setSelectedIds([])}
                            >
                                Bỏ chọn
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <Modal show={isShowModal} onHide={onHide}  centered size={"lg"}>
                <Modal.Header closeButton className="border-0">
                    <Modal.Title className="fw-bold fs-5">Chi tiết đánh giá</Modal.Title>
                </Modal.Header>
                <Modal.Body className="pt-0">
                    <div className="d-flex flex-column gap-3">
                        {/* Thông tin khách & Sao */}
                        <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded-3">
                            <div>
                                <div className="fw-bold text-dark">{review?.userName}</div>
                                <div className="text-muted small">ID: {review?.userId}</div>
                            </div>
                            <div className="text-end">
                                <Rating
                                    style={{ maxWidth: 100 }}
                                    value={review?.rating ?? 0}
                                    readOnly
                                    
                                />
                                <div className="small text-muted mt-1">{new Date(review?.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>

                        {/* Nội dung bình luận */}
                        <div>
                            <label className="fw-bold small text-secondary mb-2">Nội dung bình luận:</label>
                            <div className="p-3 border rounded-3 bg-white shadow-sm shadow-sm-hover">
                                <p className="mb-0 lh-base text-dark" style={{ whiteSpace: 'pre-line' }}>
                                    {review?.comment || "Không có nội dung bình luận."}
                                </p>
                            </div>
                        </div>

                        {/* Thông tin bổ sung */}
                        <div className="row g-2">
                            <div className="col-6">
                                <div className="p-2 border rounded small">
                                    <span className="text-muted">Sản phẩm:</span> <br />
                                    <span className="fw-medium">{review?.productId}</span>
                                </div>
                            </div>
                            <div className="col-6">
                                <div className="p-2 border rounded small">
                                    <span className="text-muted">Phân loại:</span> <br />
                                    <span className="fw-medium">{review?.skuAttributes}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-0">
                    <button className="btn-app btn-app--sm btn-app--outline w-100" onClick={onHide}>
                        Đóng
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}

export default ReviewManagement