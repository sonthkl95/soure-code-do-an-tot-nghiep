
import React from 'react'
const STATUS_OPTIONS = [
  { value: 1, label: "Đang hoạt động" },
  { value: 0, label: "Bị khóa/Chưa kích hoạt" },
];

// Giả định Role ID từ Database của bạn
const ROLE_OPTIONS = [
  { value: 1, label: "Quản trị viên (Admin)" },
  { value: 2, label: "Nhân viên (Staff)" },
  { value: 3, label: "Khách hàng (User)" },
];

const contentStatusUser = {
  1: {
    message: "Hoạt động",
    class: "status status--sm status--active"
  },
  0: {
    message: "Bị khóa",
    class: "status status--sm status--error"
  },
};
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import type { Column } from '../../types/table.type';
import Pagination from '../../components/common/Pagination';
import DataTable from '../../components/common/DataTable';
import { RiLockPasswordLine, RiLockUnlockLine, RiInformation2Line, RiMailSendLine } from 'react-icons/ri';
import { FilterIndicator } from "../../components/common/FilterIndicator ";
import { useNavigate } from 'react-router';
import { toast } from "react-toastify";
import { Modal } from "react-bootstrap";
import type { UserSummary, UserDetail } from "../../types/user.types";
import { useGetAdminUsersQuery, useGetRolesQuery, useUpdateUserRoleMutation, useUpdateUserStatusMutation } from "../../features/user/user.api";

const SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_SIZE = 10;

const UserManagement = () => {
  const [query, setQuery] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    size: parseAsInteger.withDefault(DEFAULT_SIZE),
    q: parseAsString.withDefault(""),
    status: parseAsInteger.withDefault(-1), // -1 là tất cả
    roleId: parseAsInteger.withDefault(0)
  });

  const [keywordInput, setKeywordInput] = useState(query.q);
  const [statusInput, setStatusInput] = useState(query.status);
  const [roleInput, setRoleInput] = useState(query.roleId);

  const { data: roles } = useGetRolesQuery(); // Lấy danh sách Role
  const [updateRole] = useUpdateUserRoleMutation();
  const [updateStatus] = useUpdateUserStatusMutation();

  const handleChangeRole = async (userId: string, roleId: number) => {
    try {
      await updateRole({ userId, roleId }).unwrap();
      toast.success("Đã thay đổi quyền hạn thành công");
    } catch (err) {
      toast.error("Không thể thay đổi quyền");
    }
  };
  const ROLE_OPTIONS = useMemo(() =>
    roles?.map(r => ({ value: r.id, label: r.name })) || [],
    [roles]);
  const uiPage = Math.max(1, query.page);
  const size = query.size;
  const page = uiPage - 1;

  // Sync URL -> Local State
  useEffect(() => {
    setKeywordInput(query.q);
    setStatusInput(query.status);
    setRoleInput(query.roleId);
  }, [query.q, query.status, query.roleId]);

  const applySearch = () => {
    setQuery({
      q: keywordInput || null,
      status: statusInput !== -1 ? statusInput : null,
      roleId: roleInput !== 0 ? roleInput : null,
      page: 1
    });
  };

  // API Hooks
  const { data, isLoading, isFetching } = useGetAdminUsersQuery({
    q: query.q,
    status: query.status !== -1 ? query.status : undefined,
    page: page,
    size: size
  });


  const rows: UserSummary[] = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  const columns = useMemo<Column<UserSummary>[]>(() => [
    {
      key: "user",
      title: "Người dùng",
      strong: true,
      render: (r) => (
        <div className="d-flex align-items-center gap-2">
          <img
            src={r.avatarUrl || 'https://via.placeholder.com/32'}
            className="rounded-circle border"
            width="32" height="32" alt=""
          />
          <div>
            <div className="fw-bold">{r.fullName}</div>
            <div className="text-muted small">{r.email}</div>
          </div>
        </div>
      )
    },
    { key: "phone", title: "Số điện thoại", render: (r) => r.phone || "---" },
    { key: "role", title: "Vai trò", render: (r) => <span className="badge bg-light text-dark border">{r.roleName}</span> },
    { key: "createdAt", title: "Ngày tham gia", render: (r) => new Date(r.createdAt).toLocaleDateString('vi-VN') },
    {
      key: "status",
      title: "Trạng thái",
      render: (r) => (
        <div className={contentStatusUser[r.status as keyof typeof contentStatusUser]?.class}>
          {contentStatusUser[r.status as keyof typeof contentStatusUser]?.message}
        </div>
      )
    },
  ], []);

  // Selection logic
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleToggleStatus = async (user: UserSummary) => {
    const newStatus = user.status === 1 ? 0 : 1;
    try {
      await updateStatus({ id: user.id.toString(), body: { status: newStatus } }).unwrap();
      toast.success(newStatus === 1 ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
    } catch (err) {
      toast.error("Thao tác thất bại");
    }
  };

  return (
    <div>
      <div className="container-fluid py-3 d-grid gap-3">
        {/* Search Bar */}
        <div className="table-card">
          <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">
            <div className="table-card__title form-app mb-0 d-flex flex-row align-items-center gap-2 flex-wrap">
              <input
                className="form-control form-control-sm"
                style={{ width: 280 }}
                placeholder="Tìm theo tên, email, sđt..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
              />

              <div style={{ minWidth: 200 }}>
                <Select
                  isClearable
                  placeholder="Trạng thái"
                  options={STATUS_OPTIONS}
                  value={STATUS_OPTIONS.find(o => o.value === statusInput)}
                  onChange={(val) => setStatusInput(val ? val.value : -1)}
                  components={{ DropdownIndicator: FilterIndicator, IndicatorSeparator: null }}
                />
              </div>

              <button className="btn-app btn-app--sm btn-app--default" onClick={applySearch}>
                Lọc danh sách
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable<UserSummary>
          title="Quản lý người dùng"
          description={isFetching ? "Đang cập nhật..." : "Danh sách tài khoản hệ thống"}
          columns={columns}
          rows={rows}
          loading={isLoading}
          selection={{
            enabled: true,
            getRowId: (r) => r.id.toString(),
            selectedIds,
            onToggleRow: (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]),
            onToggleAll: (ids, checked) => setSelectedIds(checked ? ids : [])
          }}
          actions={{
            width: 200,
            title: "Thao tác",
            items: [
              {
                key: "view",
                label: <RiInformation2Line />,
                onClick: (r) => { setSelectedUser(r); setShowModal(true); }
              },
              {
                key: "toggle",
                labelOption: (r) => r.status === 1 ? (<RiLockPasswordLine className="text-danger" />) : (<RiLockUnlockLine className="text-success" />),
                onClick: (r) => handleToggleStatus(r)
              },
            ]
          }}
        />

        {/* Pagination */}
        <div className="table-card">
          <Pagination
            page={uiPage}
            totalPages={totalPages}
            onChange={(p) => setQuery({ page: p })}
            totalElement={data?.totalElements}
            rowsPerPage={size}
            onRowsPerPageChange={(v) => setQuery({ size: v, page: 1 })}
          />
        </div>
      </div>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold fs-5">Thông tin tài khoản</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="row g-4">
            {/* Cột trái: Avatar */}
            <div className="col-md-4 text-center border-end">
              <img src={selectedUser?.avatarUrl || 'https://via.placeholder.com/120'}
                className="rounded-circle shadow-sm mb-3 border" width="120" height="120" alt="" />
              <h6 className="fw-bold mb-0">{selectedUser?.fullName}</h6>
              <span className="badge bg-primary-subtle text-primary mt-2">{selectedUser?.roleName}</span>
            </div>

            {/* Cột phải: Thông tin & CHỈNH QUYỀN */}
            <div className="col-md-8">
              <div className="row g-3">
                <div className="col-12">
                  <label className="text-muted small d-block mb-1 fw-bold">THAY ĐỔI QUYỀN HẠN</label>
                  <Select
                    placeholder="Chọn vai trò mới..."
                    options={ROLE_OPTIONS}
                    defaultValue={ROLE_OPTIONS.find(o => o.label === selectedUser?.roleName)}
                    onChange={(val) => {
                      if (val && selectedUser) {
                        handleChangeRole(selectedUser.id.toString(), val.value);
                      }
                    }}
                    theme={(theme) => ({
                      ...theme,
                      colors: { ...theme.colors, primary: '#0d6efd' }
                    })}
                  />
                  <p className="text-muted small mt-2">
                    * Cẩn thận: Việc thay đổi quyền sẽ ảnh hưởng trực tiếp đến các tính năng người dùng có thể truy cập.
                  </p>
                </div>
                <hr />
                <div className="col-6">
                  <label className="text-muted small d-block">Email</label>
                  <span className="fw-medium">{selectedUser?.email}</span>
                </div>
                <div className="col-6">
                  <label className="text-muted small d-block">Trạng thái</label>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className={selectedUser?.status === 1 ? "text-success" : "text-danger"}>
                      {selectedUser?.status === 1 ? "● Hoạt động" : "● Bị khóa"}
                    </span>
                    <button
                      className="btn btn-xs btn-outline-secondary py-0 px-2 shadow-none"
                      style={{ fontSize: '10px' }}
                      onClick={() => selectedUser && handleToggleStatus(selectedUser)}
                    >
                      Thay đổi
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <button className="btn-app btn-app--sm btn-app--outline w-100" onClick={() => setShowModal(false)}>Đóng</button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default UserManagement;