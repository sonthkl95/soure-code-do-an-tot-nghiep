import { useParams, useNavigate, Link } from "react-router";
import { RiEditLine } from "react-icons/ri";
import { useGetAttributeByIdQuery } from "../../features/attribute/attribute.api";
import type { AttributeDetail } from "../../types/attribute.type";
import { PiEyeSlashThin, PiEyeThin } from "react-icons/pi";
import { MdOutlineAutoDelete } from "react-icons/md";



const DATA_TYPE_LABEL = {
  TEXT: "Văn bản",
  NUMBER: "Số",
  BOOLEAN: "Bật/Tắt",
  SELECT: "Lựa chọn đơn",
  MULTI_SELECT: "Lựa chọn nhiều",
  DATE: "Chọn thời gian",
} as const;
type DataTypeKey = keyof typeof DATA_TYPE_LABEL;

const AttributeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, isError } =
    useGetAttributeByIdQuery(id as string, {
      skip: !id,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    });
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div
          className="border-app--rounded bg-white p-4"
          style={{ width: 700 }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <div className="placeholder col-6 mb-2"></div>
              <div className="placeholder col-9"></div>
            </div>
            <div className="d-flex gap-2">
              <span className="btn-app btn-app--sm btn-app--ghost disabled placeholder col-4"></span>
              <span className="btn-app btn-app--sm btn-app--default disabled placeholder col-3"></span>
            </div>
          </div>

          {/* Form fields */}
          <div className="row gy-4">
            {[1, 2, 3, 4].map((i) => (
              <div className="col-6" key={i}>
                <div className="placeholder col-4 mb-1"></div>
                <div className="placeholder col-12" style={{ height: 32 }}></div>
              </div>
            ))}

            <div className="col-12">
              <div className="placeholder col-3 mb-1"></div>
              <div className="placeholder col-4" style={{ height: 34 }}></div>
            </div>

            {/* Table placeholder */}
            <div className="col-12 mt-3">
              <div className="placeholder col-5 mb-2"></div>
              <div className="border rounded p-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="d-flex justify-content-between mb-3"
                  >
                    <div className="placeholder col-6"></div>
                    <div className="placeholder col-3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const getStatusClass = (active: boolean, deprecated: boolean) => {
    let statusBadge: React.ReactNode;
    if (deprecated) {
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
  if (isError || !data) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="border-app--rounded bg-white p-4" style={{ width: 700 }}>
          Không tìm thấy thuộc tính.
        </div>
      </div>
    );
  }
  const isSelect = data.dataType === "SELECT" || data.dataType === "MULTI_SELECT";

  // đổi key theo BE của bạn
  return (
    <div className="d-flex justify-content-center mt-5">
      <div className="border-app--rounded bg-white" style={{ width: 700 }}>
        {/* Header giống Create */}
        <div className="d-flex align-items-center justify-content-between py-3 px-4 my-2 border-bottom">
          <div>
            <div className="fw-bold fs-6">Chi tiết thuộc tính</div>
            <div className="f-body-3xs">
              Xem thông tin trường dữ liệu kỹ thuật cho sản phẩm.
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="btn-app btn-app--sm btn-app--ghost"
            >
              Quay lại
            </button>

            <Link
              to={`../edit/${data.id}`}
              className="btn-app btn-app--sm btn-app--default"
            >
              <RiEditLine />
              <span>Sửa</span>
            </Link>
          </div>
        </div>

        {/* Body */}
        <form className="py-3 px-4 mb-5">
          <fieldset disabled>
            <div className="form-app row flex-row gap-0 gy-4">
              <div className="col-6">
                <label className="form-label">
                  Tên hiển thị <span className="text-danger">*</span>
                </label>
                <span
                  className="form-control bg-light form-control-sm d-inline-flex align-items-center"
                >
                  {data.label ?? ""}
                </span>
              </div>

              <div className="col-6">
                <label className="form-label">
                  Mã (CODE) <span className="text-danger">*</span>
                </label>
                <span
                  className="form-control bg-light form-control-sm d-inline-flex align-items-center"
                >
                  {data.code ?? ""}
                </span>
              </div>
              {data?.unit && (
                <div className="col-6">
                  <label className="form-label">
                    Đơn vị
                    {data.dataType === "NUMBER" && (
                      <span className="text-danger"> *</span>
                    )}
                  </label>
                  <span className="form-control bg-light form-control-sm d-inline-flex align-items-center">
                    {data.dataType === "NUMBER" ? data?.unit ?? "" : ""}
                  </span>
                </div>
              )}

              <div className="col-6">
                <label className="form-label">
                  Kiểu dữ liệu <span className="text-danger">*</span>
                </label>
                <span
                  className="form-control bg-light form-control-sm d-inline-flex align-items-center"
                >{DATA_TYPE_LABEL[data.dataType as DataTypeKey] ?? ""}</span>
              </div>
              <div className="col-12 d-flex align-items-end">
                <button disabled className={`d-flex align-items-center gap-2 btn-app ${data?.active ? "btn-app--active" : "btn-app--destructive"}`} type="button">
                  {data?.active ? (
                    <>
                      <PiEyeThin size={20} />
                      <span>Hoạt động</span>
                    </>
                  ) : (
                    <>
                      <PiEyeSlashThin size={20} />
                      <span>Vô hiệu hóa</span>
                    </>
                  )}
                </button>
              </div>
              <div className="col-12" hidden>
                <label className="form-label">ID</label>
                <input
                  style={{ verticalAlign: "middle" }}
                  className="form-control form-control-sm"
                  value={data.id ?? ""}
                  readOnly
                />
              </div>

              {/* Options */}
              {isSelect && (
                <div className="col-12">
                  <label className="form-label">
                    Danh sách lựa chọn <span className="text-danger">*</span>
                  </label>
                  <div className=" table-responsive rounded">
                    <table className="table-app table-sm align-middle">
                      <colgroup>
                        <col style={{ width: "10%" }} />
                        <col style={{ width: "50%" }} />
                        <col style={{ width: "40%" }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th scope="col">STT</th>
                          <th scope="col" className="ps-2">Giá trị</th>
                          <th scope="col" className="ps-2">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.options.length === 0 ? (
                          <tr>
                            <td colSpan={2} className="text-muted">
                              Không có lựa chọn nào.
                            </td>
                          </tr>
                        ) : (
                          data?.options.map((opt) => (
                            <tr key={opt?.id}>
                              <td>
                                <span>{opt.displayOrder + 1}</span>
                              </td>
                              <td>
                                <span className="f-caption">{opt.label}</span>
                              </td>
                              <td>
                                {getStatusClass(opt.active, !!opt.deprecated)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  )
}

export default AttributeDetail