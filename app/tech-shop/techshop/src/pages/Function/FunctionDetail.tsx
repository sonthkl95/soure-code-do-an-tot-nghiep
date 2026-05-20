import { FiLayers } from "react-icons/fi"
import { RiEditLine } from "react-icons/ri"
import { useNavigate, useParams } from "react-router"
import type { IconOption } from "../../features/data/icon.data"
import { optionIcons } from "../../features/data/icon.data"
import { toast } from "react-toastify"
import { useEffect, useMemo } from "react"

import { useGetFunctionByIdQuery } from "../../features/functions/function.api"

const FunctionDetail = () => {
  const navigate = useNavigate()
  const { id: functionId } = useParams<{ id: string }>()

  const {
    data: functionDetail,
    isLoading,
    isError,
    error,
  } = useGetFunctionByIdQuery(functionId!, { skip: !functionId })

  useEffect(() => {
    if (!isError) return
    toast.error((error as any)?.data?.message ?? "Không tải được dữ liệu chức năng")
  }, [isError, error])

  const iconOptions = useMemo(() => optionIcons, [])
  const iconData: IconOption | undefined = iconOptions.find(
    (o) => o.value === (functionDetail?.icon ?? null)
  )
  const IconComp = iconData?.Icon

  if (isLoading) return <div className="m-4">Đang tải dữ liệu...</div>
  if (!functionDetail) return <div className="m-4">Không có dữ liệu.</div>

  const subFunctions = functionDetail.subFunctions ?? []

  return (
    <div className="border-app--rounded bg-white m-4 py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between border-bottom px-4 pb-4">
        <div>
          <div className="fw-bold fs-6">Chi tiết chức năng</div>
          <div className="f-caption">Xem thông tin mô-đun và các quyền khả dụng.</div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button
            className="btn-app btn-app--ghost btn-app--sm"
            type="button"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </button>

          <button
            className="btn-app btn-app--sm d-flex align-items-center gap-2"
            type="button"
            onClick={() => navigate(`/functions/edit/${functionDetail.id}`)}
          >
            <RiEditLine />
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        <div className="row gx-5 gy-4">
          <div className="col-12 col-md-6">
            <div className="form-label">Tên chức năng</div>
            <div className="form-control form-control-sm bg-light">
              {functionDetail.name || "-"}
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-label">Mã chức năng</div>
            <div className="form-control form-control-sm bg-light">
              {functionDetail.code || "-"}
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-label">Biểu tượng</div>
            <div className="form-control form-control-sm bg-light d-flex align-items-center gap-2">
              {IconComp ? <IconComp size={16} /> : <span style={{ width: 16 }} />}
              <span>{iconData?.label ?? "-"}</span>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="form-label">Thứ tự sắp xếp</div>
            <div className="form-control form-control-sm bg-light">
              {functionDetail.sortOrder ?? "-"}
            </div>
          </div>

          <div className="col-12">
            <div className="form-label">Mô tả</div>
            <div
              className="form-control form-control-sm bg-light"
              style={{ minHeight: 90, whiteSpace: "pre-wrap" }}
            >
              {functionDetail.description || "-"}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 border-top" />

        {/* Sub functions */}
        <div className="fw-bold mb-2">Chức năng con</div>

        {subFunctions.length > 0 ? (
          <div style={{ minHeight: 240 }}>
            <div className="table-card--sm table-responsive">
              <table className="table table-app mb-0">
                <thead>
                  <tr>
                    <th className="col-tt">
                      <span className="ps-2 d-inline-block">TT</span>
                    </th>
                    <th className="col-id">ID</th>
                    <th>Tên</th>
                    <th>Mô tả</th>
                  </tr>
                </thead>

                <tbody>
                  {subFunctions.map((sl: any, index: number) => (
                    <tr key={sl.id}>
                      <td className="col-tt">
                        <span className="ps-2 d-inline-block">{index + 1}</span>
                      </td>
                      <td className="fw-600">{sl.code}</td>
                      <td className="text-muted">{sl.name}</td>
                      <td className="text-muted">{sl.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border-app--rounded border p-5 text-center mb-5">
            <div className="d-flex justify-content-center mb-3" style={{ opacity: 0.6 }}>
              <FiLayers size={28} />
            </div>
            <div className="text-muted mb-2">Chưa có chức năng con nào được xác định.</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FunctionDetail
