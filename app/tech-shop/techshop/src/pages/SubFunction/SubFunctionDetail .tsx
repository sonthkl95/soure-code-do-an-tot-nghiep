import { Col, Row } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import Select from "react-select";

import { useGetFunctionOptionsQuery } from "../../features/functions/function.api";
import { useGetSubFunctionByIdQuery } from "../../features/subfunction/subfunction.api";

import type { FunctionOption } from "../../types/function.type";
import SubFunctionSkeleton from "./SubFunctionSkeleton ";

type Option = {
  label: string;
  value: string;
};

const SubFunctionDetail = () => {
  const { id } = useParams(); // route: /subfunctions/:id

  // Options functions (để hiển thị tên Function theo functionId)
  const {
    data: optionFunctions,
    isLoading: isOptionLoading,
    isError: isOptionError,
    error: errorOption,
  } = useGetFunctionOptionsQuery(null);

  // Detail subfunction
  const {
    data: subFunctionDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
    error: detailError,
  } = useGetSubFunctionByIdQuery(id as string, {
    skip: !id,
  });

  const options: Option[] = useMemo(() => {
    return (
      optionFunctions?.map((of: FunctionOption) => ({
        label: of.name,
        value: of.id,
      })) ?? []
    );
  }, [optionFunctions]);

  // toast lỗi options (1 lần)
  useEffect(() => {
    if (isOptionError) {
      toast.error((errorOption as any)?.data?.message ?? "Có lỗi xảy ra");
    }
  }, [isOptionError, errorOption]);

  // toast lỗi detail (1 lần)
  useEffect(() => {
    if (isDetailError) {
      toast.error((detailError as any)?.data?.message ?? "Không tải được dữ liệu");
    }
  }, [isDetailError, detailError]);

  // unwrap ApiResponse nếu có
  const item = (subFunctionDetail as any)?.data ?? subFunctionDetail;

  const functionId: string | null =
    item?.functionId ?? item?.function?.id ?? null;

  const functionOption = options.find((o) => o.value === functionId) ?? null;
  const navigate = useNavigate();
  return (
    <div className="d-flex justify-content-center mt-5">
      <div className="border-app--rounded bg-white" style={{ minWidth: "500px" }}>
        <div className="d-flex align-items-center justify-content-between py-3 px-4 my-2 border-bottom">
          <div>
            <div className="fw-bold fs-6">Chi tiết chức năng con</div>
            <div className="f-body-3xs">Thông tin quyền cụ thể trong một mô-đun.</div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button onClick={() => navigate(-1)}  className="btn-app btn-app--sm btn-app--ghost">
              Quay lại
            </button>

            {/* Nếu bạn có trang edit */}
            <Link
              to={`/subfunctions/edit/${id}`}
              className="btn-app btn-app--sm btn-app--default"
            >
              Chỉnh sửa
            </Link>
          </div>
        </div>

        <div className="py-3 px-4 form-app mb-5">
          {isDetailLoading ? (
            <SubFunctionSkeleton />
          ) : (
            <>
              <div className="mb-5">
                <div>Chức năng:</div>
                <div className="f-body-3xs mb-2">Quyền này thuộc về mô-đun hệ thống nào?</div>

                {/* readonly select */}
                <Select<Option, false>
                  options={options}
                  value={functionOption}
                  isClearable={false}
                  isDisabled={true}
                  isLoading={isOptionLoading}
                  placeholder="Không có"
                  components={{ IndicatorSeparator: null }}
                />
              </div>

              <Row>
                <Col>
                  <label htmlFor="code">
                    Mã quyền hạn: <span className="text-danger">*</span>
                  </label>
                  <input
                    value={item?.code ?? ""}
                    disabled
                    type="text"
                    id="code"
                    className="form-control form-control-sm"
                  />
                </Col>

                <Col>
                  <label htmlFor="NAME">
                    Tên quyền hạn: <span className="text-danger">*</span>
                  </label>
                  <input
                    value={item?.name ?? ""}
                    disabled
                    type="text"
                    id="NAME"
                    className="form-control form-control-sm"
                  />
                </Col>
              </Row>

              <div>
                <label htmlFor="description">
                  Mô tả: <span className="text-danger">*</span>
                </label>
                <textarea
                  value={item?.description ?? ""}
                  disabled
                  id="description"
                  className="form-control"
                  rows={4}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubFunctionDetail;
