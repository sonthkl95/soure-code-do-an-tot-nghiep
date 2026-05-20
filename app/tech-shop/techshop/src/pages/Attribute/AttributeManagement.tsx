import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import {
  useQueryStates,
  parseAsInteger,
  parseAsString,
  parseAsNativeArrayOf,
} from "nuqs";
import type { Column } from '../../types/table.type';
import Pagination from '../../components/common/Pagination';
import DataTable from '../../components/common/DataTable';
import { RiDeleteBin6Line, RiEditLine, RiEyeLine } from 'react-icons/ri';
import { FilterIndicator } from "../../components/common/FilterIndicator ";
import { SortIndicator } from "../../components/common/SortIndicator ";
import type { Page } from "../../types/page.type";
import { Link, useNavigate } from 'react-router';
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";
import { useChangeActiveOfAttributeMutation, useDeleteAttributeMutation, useGetAttributesQuery, useRevokeAttributeMutation } from "../../features/attribute/attribute.api";
import type { Attribute } from "../../types/attribute.type";
import { MdOutlineAutoDelete } from "react-icons/md";
import { PiEyeSlashThin, PiEyeThin } from "react-icons/pi";
import { HiOutlineLockClosed, HiOutlineLockOpen } from "react-icons/hi2";
import { useAppSelector } from "../../store/hook";
import { TbArrowBackUpDouble } from "react-icons/tb";
const SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_SIZE = 10;
const normalizeSize = (raw: number) =>
  (SIZE_OPTIONS as readonly number[]).includes(raw) ? raw : DEFAULT_SIZE;

type Option = { value: string; label: string };
const FIELD_OPTIONS: Option[] = [
  { value: "label", label: "Tên hiển thị" },
  { value: "code", label: "Mã (CODE)" },
];

const SORT_OPTIONS: Option[] = [
  { value: "code:asc", label: "Mã (CODE) A→Z" },
  { value: "code:desc", label: "Mã (CODE) Z→A" },
  { value: "label:asc", label: "Tên hiển thị A→Z" },
  { value: "label:desc", label: "Tên hiển thị Z→A" },
];

const DATA_TYPE_LABEL = {
  TEXT: "Văn bản",
  NUMBER: "Số",
  BOOLEAN: "Bật/Tắt",
  SELECT: "Lựa chọn đơn",
  MULTI_SELECT: "Lựa chọn nhiều",
  DATE: "Chọn thời gian",
} as const;
type DataTypeKey = keyof typeof DATA_TYPE_LABEL;
const AttributeManagement = () => {
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
  useEffect(() => {
    if (query.size !== size) setQuery({ size, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.size, size]);

  // input box nên là local state để gõ mượt, còn query dùng debounced
  const [keywordInput, setKeywordInput] = useState(query.q);
  const [fieldDraft, setFieldDraft] = useState<string[]>(query.field);
  const [sortDraft, setSortDraft] = useState<string>(query.sort);

  // Khi URL thay đổi (back/forward, share link, v.v.) -> sync draft theo applied
  useEffect(() => setKeywordInput(query.q), [query.q]);
  useEffect(() => setFieldDraft(query.field), [query.field]);
  useEffect(() => setSortDraft(query.sort), [query.sort]);
  const applySearch = () => {
    setQuery({
      q: keywordInput,
      field: fieldDraft,
      sort: sortDraft,
      page: 1, // reset về trang 1 khi search
    });
  };
  const { data, isLoading, isFetching } = useGetAttributesQuery({
    keyword: query.q, // không debounce vì chỉ đổi khi applySearch
    page,
    size,
    fields: query.field,
    sort: query.sort,
  }, { refetchOnFocus: true, refetchOnReconnect: true })
  const rows: Attribute[] = data?.content ?? [];
  console.log(data?.content);

  const totalPages = Math.max(
    1,
    Math.ceil(((data as Page<Attribute>)?.page?.totalElements ?? 0) / size)
  );
  const [changeActive, { isLoading: isLoadingActive }] = useChangeActiveOfAttributeMutation();
  useEffect(() => {
    if (uiPage > totalPages) setQuery({ page: totalPages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);
  const getStatusClass = (active: boolean, deleted: boolean) => {
    let statusBadge: React.ReactNode;
    if (deleted) {
      statusBadge = (
        <div className="badge bg-secondary">
          <MdOutlineAutoDelete />
          <span>Đã xóa</span>
        </div>
      );
    } else if (active) {
      statusBadge = (
        <div className="badge bg-success">
          <PiEyeThin />
          <span>Hoạt động</span>
        </div>
      );
    } else {
      statusBadge = (
        <div className="badge bg-danger">
          <PiEyeSlashThin />
          <span>Vô hiệu hóa</span>
        </div>
      );
    }
    return statusBadge;
  };
  const columns = useMemo<Column<Attribute>[]>(() =>
    [
      { key: "code", title: "Mã (CODE)", strong: true, render: (r) => r.code },
      { key: "label", title: "Tên hiển thị", muted: true, render: (r) => r.label },
      { key: "dataType", title: "Kiểu dữ liệu", muted: true, render: (r) => DATA_TYPE_LABEL[r.dataType as DataTypeKey] ?? "" },
      { key: "status", title: "Trạng thái", muted: true, render: (r) => getStatusClass(r.active, r.deleted) },
    ]
    , []);

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


  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Attribute | null>(null);

  const openDelete = (row: Attribute) => {
    setDeleteTarget(row);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };
  const [deleteAttribute, { isLoading: isDeleting }] =
    useDeleteAttributeMutation();
  const [revokeAttribute, { isLoading: isRevoking }] = useRevokeAttributeMutation();
  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;

    try {
      const res = await deleteAttribute(deleteTarget.id).unwrap();
      toast.success(res?.message ?? "Xoá thành công");
      // dọn selection nếu đang chọn
      setSelectedIds((prev) => prev.filter((x) => x !== deleteTarget.id));
      closeDelete();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Có lỗi xảy ra khi xoá");
    }
  };
  const { user } = useAppSelector((state) => state.auth)
  return (
    <div className="container-fluid py-3 gap-3 d-flex flex-column">
      {/* Search */}
      <div className="border-app rounded p-2 bg-white">
        <div className="form-app mb-0 d-flex flex-row align-items-center gap-2 flex-wrap">
          {/* keyword */}
          <div>
            <input
              className="form-control form-control-sm"
              placeholder="Tìm kiếm quyền..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applySearch();
              }}
            />

          </div>
          {/* multi filter: field */}
          <div>
            <Select
              isMulti
              placeholder="Tìm theo trường..."
              options={FIELD_OPTIONS}
              value={fieldValue}
              onChange={(vals) => {
                const next = (vals as Option[]).map((v) => v.value);
                setFieldDraft(next); // ✅ chỉ đổi draft
              }}
              styles={{
                control: (base, props) => ({
                  ...base,
                  minHeight: 34,
                  height: 34
                }),
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
              styles={{
                control: (base, props) => ({
                  ...base,
                  minHeight: 34,
                  height: 34
                }),
              }}
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
        <div className="d-flex mt-3 align-items-center justify-content-between flex-wrap">
          <button
            className="btn-app btn-app--sm btn-app--default"
            onClick={applySearch}
            disabled={!hasPendingChanges}
            title={!hasPendingChanges ? "Không có thay đổi" : "Áp dụng tìm kiếm"}
          >
            Tìm kiếm
          </button>
          {
            user?.permissions.includes("CREATE_ATTRIBUTE") && (
              <div className="d-flex align-items-center gap-2">
                <Link to="create" className="btn-app btn-app--sm btn-app--default">
                  Thêm thuộc tính
                </Link>
              </div>
            )
          }
        </div>
      </div>
      {/* Table */}
      <DataTable<Attribute>
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
            { key: "view", visible: () => user?.permissions.includes("VIEW_ATTRIBUTE") ?? false, label: <RiEyeLine />, onClick: (r) => navigate(`view/${r.id}`) },
            { key: "edit", visible: () => user?.permissions.includes("EDIT_ATTRIBUTE") ?? false, label: <RiEditLine />, onClick: (r) => navigate(`edit/${r.id}`) },
            { key: "backup", visible: (r) => r.deleted, label: <TbArrowBackUpDouble />, onClick: (r) => revokeAttribute(r.id) },
            {
              key: "lock",
              visible: () => user?.permissions.includes("EDIT_ATTRIBUTE") ?? false,
              labelOption: (r) => {
                if (r.active) return <HiOutlineLockClosed />
                return <HiOutlineLockOpen />
              },
              onClick: (r) => changeActive(r.id)
            },
            {
              key: "delete",
              label: <RiDeleteBin6Line />,
              visible: () => user?.permissions.includes("DELETE_ATTRIBUTE") ?? false,
              tone: "danger",
              onClick: (r) => {
                openDelete(r)
              },
            },
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
          totalElement={data?.page?.totalElements}
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
      {/*Modal*/}
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
          <div className="mb-2">Bạn có chắc chắn muốn xoá thuộc tính:</div>

          <div
            className="p-3 rounded"
            style={{
              background: "var(--neutral-50)",
              border: "1px solid var(--app-border)",
            }}
          >
            <div className="fw-semibold">{deleteTarget?.label}</div>
            <div className="text-muted" style={{ color: "var(--app-text-muted)" }}>
              ID: {deleteTarget?.id}
            </div>
          </div>

          <div className="mt-3" style={{ color: "var(--app-text-muted)" }}>
            Hành động này không thể hoàn tác.
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn-app btn-app--sm btn-app--ghost p-3"
            onClick={closeDelete}
            disabled={isDeleting}
          >
            Huỷ
          </button>
          <button
            type="button"
            className="btn-app btn-app--sm btn-app--danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            <RiDeleteBin6Line />
            {isDeleting ? "Đang xoá..." : "Xoá"}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default AttributeManagement