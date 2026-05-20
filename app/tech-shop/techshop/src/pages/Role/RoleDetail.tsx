import { useMemo } from "react";
import { Col, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import AccordionSelect, { type Section } from "../../components/common/AccordionSelect";
import { useGetAllFunctionsQuery } from "../../features/functions/function.api";
import { toSection } from "../../types/function.type";
import { Link, useParams } from "react-router";

// dùng lại query role detail
import { useGetRoleByIdQuery } from "../../features/roles/role.api";

type RoleInput = {
  id: string;
  code: string,
  name: string;
  description: string;
};

const RoleDetail = () => {
  const { id: roleIdParam } = useParams<{ id: string }>();

  // ===== Fetch functions (để render quyền) =====
  const {
    data: functions,
    isLoading: isLoadingFunctions,
    isError: isErrorFunctions,
    error: errorFunctions,
  } = useGetAllFunctionsQuery(null);

  const sections: Section[] = useMemo(() => toSection(functions), [functions]);

  // ===== Fetch role detail =====
  const {
    data: roleDetail,
    isLoading: isLoadingRole,
    isError: isErrorRole,
    error: errorRole,
  } = useGetRoleByIdQuery(roleIdParam!, { skip: !roleIdParam });

  // ===== Derive role fields (NO state, NO effect) =====
  const roleValues: RoleInput = useMemo(() => {
    const id = roleDetail?.id ?? "";
    const code = roleDetail?.code ?? "";
    const name = roleDetail?.name ?? "";
    const description = roleDetail?.description ?? "";
    return { id, name, description, code };
  }, [roleDetail]);

  const selected = useMemo<string[]>(() => {
    return (roleDetail?.subFunctions ?? []) as string[];
  }, [roleDetail]);

  // base = selected (detail page không có thay đổi)
  const selectedBase = selected;

  // ===== React Hook Form (read-only) =====
  // ✅ Dùng values để sync dữ liệu mà không cần reset() trong effect
  // Nếu version RHF của bạn chưa hỗ trợ "values", mình sẽ đưa option B bên dưới.
  const { register } = useForm<RoleInput>({
    values: roleValues,
  });

  // ===== Loading/Error =====
  if (!roleIdParam) {
    return (
      <div className="p-2 border-app--rounded bg-surface">
        <div className="form-message-error">Thiếu id vai trò trên URL.</div>
        <Link to="/roles" className="btn-app btn-app--sm btn-app--ghost mt-2">
          Quay lại
        </Link>
      </div>
    );
  }

  const isLoading = isLoadingFunctions || isLoadingRole;
  const isError = isErrorFunctions || isErrorRole;

  if (isLoading) {
    return (
      <div className="p-2 border-app--rounded bg-surface">
        <div className="f-body">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-2 border-app--rounded bg-surface">
        <div className="form-message-error">
          {((errorRole as any)?.data?.message ??
            (errorFunctions as any)?.data?.message ??
            "Có lỗi xảy ra khi tải dữ liệu")}
        </div>
        <Link to="/roles" className="btn-app btn-app--sm btn-app--ghost mt-2">
          Quay lại
        </Link>
      </div>
    );
  }

  return (
    <div className="p-2 border-app--rounded bg-surface">
      <div className="d-flex align-items-center justify-content-end my-2">
        <div className="d-flex align-items-center gap-2">
          <Link to="/roles" className="btn-app btn-app--sm btn-app--ghost">
            Quay lại
          </Link>

          <Link to={`/roles/edit/${roleIdParam}`} className="btn-app btn-app--sm btn-app--default">
            Chỉnh sửa
          </Link>

        </div>
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <form className="form-app p-2">
            <div hidden>
              <label htmlFor="ID">
                ID vai trò: <span className="text-danger">*</span>
              </label>
              <input
                disabled={true}
                {...register("id")}
                type="text"
                id="ID"
                className="form-control form-control-sm"
              />
            </div>
            <div>
              <label htmlFor="code">
                Mã vai trò: <span className="text-danger">*</span>
              </label>
              <input
                disabled={true}
                {...register("code")}
                type="text"
                id="code"
                className="form-control form-control-sm"
              />
            </div>
            <div>
              <label htmlFor="name">
                Tên vai trò: <span className="text-danger">*</span>
              </label>
              <input
                disabled={true}
                {...register("name")}
                type="text"
                id="name"
                className="form-control form-control-sm"
              />
            </div>

            <div>
              <label htmlFor="description">
                Mô tả: <span className="text-danger">*</span>
              </label>
              <textarea
                disabled={true}
                {...register("description")}
                id="description"
                className="form-control"
              />
            </div>
          </form>

          <div className="border-app--rounded  bg-neutral-100 p-2 m-2">
            <div className="f-medium">Tóm tắt</div>
            <div className="d-flex align-items-center justify-content-between">
              <span className="f-body-2xs">Chức năng đã chọn:</span>
              <span className="d-inline-block bg-white py-1 px-2 app-radius__sm f-body-xs">
                {selected.length}
              </span>
            </div>
          </div>
        </Col>

        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <span className="f-section">Cấu hình quyền</span>
            <span className="f-micro">Danh sách chức năng mà vai trò này có thể truy cập.</span>
          </div>

          <div className="d-flex flex-column gap-2">
            <AccordionSelect
              disabled={true}
              sections={sections}
              value={selected}
              selectedValue={selectedBase}
              onChange={() => { }}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default RoleDetail;
