import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import Select from "react-select";
import {
    useQueryStates,
    parseAsInteger,
    parseAsString,
    parseAsNativeArrayOf,
} from "nuqs";
import { useDeleteSubFunctionMutation, useGetSubFunctionsQuery } from "../../features/subfunction/subfunction.api";
import type { Column } from "../../types/table.type";
import Pagination from "../../components/common/Pagination";
import DataTable from "../../components/common/DataTable";
import {  RiDeleteBin6Line, RiEditLine, RiEyeLine } from "react-icons/ri";
import { FilterIndicator } from "../../components/common/FilterIndicator ";
import { SortIndicator } from "../../components/common/SortIndicator ";
import type { Page } from "../../types/page.type";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import type { SubFunction } from "../../types/subFunction.type";

const SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_SIZE = 10;

const normalizeSize = (raw: number) =>
    (SIZE_OPTIONS as readonly number[]).includes(raw) ? raw : DEFAULT_SIZE;

type Option = { value: string; label: string };

const FIELD_OPTIONS: Option[] = [
    { value: "code", label: "Mã quyền hạn" },
    { value: "name", label: "Tên" },
];

const SORT_OPTIONS: Option[] = [
    { value: "code:asc", label: "Mã A→Z" },
    { value: "code:desc", label: "Mã Z→A" },
    { value: "name:asc", label: "Tên A→Z" },
    { value: "name:desc", label: "Tên Z→A" },
];

export default function SubFunctionManagement() {
    // ✅ "Applied state" (sync URL) -> chỉ đổi khi APPLY SEARCH
    const [query, setQuery] = useQueryStates({
        page: parseAsInteger.withDefault(1), // UI 1-based
        size: parseAsInteger.withDefault(DEFAULT_SIZE),
        q: parseAsString.withDefault(""),
        field: parseAsNativeArrayOf(parseAsString).withDefault([]),
        sort: parseAsString.withDefault("code:asc"),
    });

    // normalize page/size từ URL
    const uiPage = Math.max(1, query.page);
    const size = normalizeSize(query.size);
    const page = uiPage - 1; // API 0-based

    // nếu size trong URL không hợp lệ → sửa lại URL
    useEffect(() => {
        if (query.size !== size) setQuery({ size, page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.size, size]);

    // ✅ "Draft state" (local) -> user chọn/gõ thoải mái, KHÔNG call API
    const [keywordInput, setKeywordInput] = useState(query.q);
    const [fieldDraft, setFieldDraft] = useState<string[]>(query.field);
    const [sortDraft, setSortDraft] = useState<string>(query.sort);

    // Khi URL thay đổi (back/forward, share link, v.v.) -> sync draft theo applied
    useEffect(() => setKeywordInput(query.q), [query.q]);
    useEffect(() => setFieldDraft(query.field), [query.field]);
    useEffect(() => setSortDraft(query.sort), [query.sort]);

    // ✅ Chỉ khi APPLY thì mới update query => lúc đó RTK Query mới fetch
    const applySearch = () => {
        setQuery({
            q: keywordInput,
            field: fieldDraft,
            sort: sortDraft,
            page: 1, // reset về trang 1 khi search
        });
    };

    // ✅ gọi API theo "applied state" (query.*)
    const { data, isLoading, isFetching } = useGetSubFunctionsQuery(
        {
            keyword: query.q, // không debounce vì chỉ đổi khi applySearch
            page,
            size,
            fields: query.field,
            sort: query.sort,
        },
        { refetchOnFocus: true, refetchOnReconnect: true }
    );
    console.log(data);
    
    const rows: SubFunction[] = data?.content ?? [];
    const totalPages = Math.max(
        1,
        Math.ceil(((data as Page<SubFunction>)?.totalElements ?? 0) / size)
    );

    // nếu user sửa URL page quá lớn → đẩy về trang cuối
    useEffect(() => {
        console.log({totalPages});
        
        if (uiPage > totalPages) setQuery({ page: totalPages });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages]);

    const columns = useMemo<Column<SubFunction>[]>(
        () => [
            { key: "code", title: "Mã quyền hạn", strong: true, render: (r) => r.code },
            { key: "name", title: "Tên", muted: true, render: (r) => r.name },
            {
                key: "description",
                title: "Mô tả",
                muted: true,
                render: (r) => r.description,
            },
            {
                key: "function",
                title: "Chức năng",
                muted: true,
                render: (r) => r?.function?.name ?? "Chưa phân loại",
            },
        ],
        []
    );

    // selection local
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

    // react-select value mappings (draft)
    const fieldValue = FIELD_OPTIONS.filter((o) => fieldDraft.includes(o.value));
    const sortValue =
        SORT_OPTIONS.find((o) => o.value === sortDraft) ?? SORT_OPTIONS[0];

    const hasPendingChanges =
        keywordInput !== query.q ||
        sortDraft !== query.sort ||
        JSON.stringify(fieldDraft) !== JSON.stringify(query.field);
    const navigate = useNavigate();
    const [deleteTarget, setDeleteTarget] = useState<SubFunction | null>(null);
    const isDeleteOpen = !!deleteTarget;

    const closeDelete = () => setDeleteTarget(null);
    const [deleteSubFunction, { isLoading: isDeleting }] = useDeleteSubFunctionMutation()
    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            await deleteSubFunction(deleteTarget.id).unwrap();

            toast.success(`Đã xoá "${deleteTarget.code}"`);
            closeDelete();
        } catch (e: any) {
            toast.error(e?.data?.message ?? "Có lỗi xảy ra");
        }
    };
    return (
        <div className="container-fluid py-3 d-grid gap-3">
            {/* Search + Filters */}
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
                                isMulti
                                placeholder="Tìm theo trường..."
                                options={FIELD_OPTIONS}
                                value={fieldValue}
                                onChange={(vals) => {
                                    const next = (vals as Option[]).map((v) => v.value);
                                    setFieldDraft(next); // ✅ chỉ đổi draft
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
                                placeholder="Sắp xếp..."
                                options={SORT_OPTIONS}
                                value={sortValue}
                                onChange={(val) => {
                                    const v = (val as Option | null)?.value ?? "id:asc";
                                    setSortDraft(v);
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
                            Thêm quyền hạn
                        </Link>
                    </div>
                </div>
            </div>

            {/* Table */}
            <DataTable<SubFunction>
                title="Danh sách quyền"
                description={isFetching ? "Đang tải…" : "Quản lí quyền"}
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
                }}
                actions={{
                    width: 320,
                    title: "Thao tác",
                    items: [
                        { key: "view", label: <RiEyeLine />, onClick: (r) => navigate(`/subfunctions/detail/${r.id}`) },
                        { key: "edit", label: <RiEditLine />, onClick: (r) => navigate(`/subfunctions/edit/${r.id}`) },
                        {
                            key: "delete",
                            label: <RiDeleteBin6Line />,
                            tone: "danger",
                            onClick: (r) => setDeleteTarget(r)
                        },
                    ],
                }}
            />

            {/* Pagination */}
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

            {/* Selected summary */}
            {selectedIds.length > 0 && (
                <div className="table-card">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="fw-semibold">Đã chọn: {selectedIds.length}</div>
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
            {/* ---- Delete Modal */}
            <Modal
                show={isDeleteOpen}
                onHide={closeDelete}
                centered
                dialogClassName="modal-app"
                backdropClassName="modal-app-backdrop"
            >
                <Modal.Header>
                    <Modal.Title>
                        <span className="fw-bold fs-5">Xác nhận xoá</span>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="mb-2">
                        Bạn có chắc chắn muốn xoá quyền:
                    </div>

                    <div className="p-3 rounded" style={{ background: "var(--neutral-50)", border: "1px solid var(--app-border)" }}>
                        <div className="fw-semibold">{deleteTarget?.name}</div>
                        <div className="text-muted" style={{ color: "var(--app-text-muted)" }}>
                            ID: {deleteTarget?.id}
                        </div>
                    </div>

                    <div className="mt-3" style={{ color: "var(--app-text-muted)" }}>
                        Hành động này không thể hoàn tác.
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <button type="button" className="btn-app btn-app--sm btn-app--ghost p-3" onClick={closeDelete}>
                        Huỷ
                    </button>
                    <button type="button" className="btn-app btn-app--sm btn-app--danger" onClick={handleConfirmDelete}>
                        <RiDeleteBin6Line />
                        Xoá
                    </button>
                </Modal.Footer>
            </Modal>

            {/* ...*/}
        </div>
    );
}
