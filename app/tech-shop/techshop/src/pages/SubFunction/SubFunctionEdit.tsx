import { Col, Row } from "react-bootstrap";
import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { RiSave3Line } from "react-icons/ri";
import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";

import { useGetFunctionOptionsQuery } from "../../features/functions/function.api";
import {
    useGetSubFunctionByIdQuery,
    useUpdateSubFunctionMutation,
} from "../../features/subfunction/subfunction.api";

import type { FunctionOption } from "../../types/function.type";
import type { SubFunctionForm } from "../../types/subFunction.type";
import SubFunctionSkeleton from "./SubFunctionSkeleton ";

type Option = {
    label: string;
    value: string;
};

const SubFunctionEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // route: /subfunctions/:id/edit

    const {
        register,
        formState: { errors },
        handleSubmit,
        control,
        reset,
    } = useForm<SubFunctionForm>({
        defaultValues: { functionId: null, id: "", name: "", description: "" },
    });

    // Load options for select
    const {
        data: optionFunctions,
        isLoading: isOptionLoading,
        isError: isOptionError,
        error: errorOption,
    } = useGetFunctionOptionsQuery(null);

    // Load current subfunction data
    const {
        data: subFunctionDetail,
        isLoading: isDetailLoading,
        isError: isDetailError,
        error: detailError,
    } = useGetSubFunctionByIdQuery(id as string, {
        skip: !id,
    });

    const [updateSubFunction, { isLoading: isUpdating }] =
        useUpdateSubFunctionMutation();

    // Map options
    const options: Option[] = useMemo(() => {
        return (
            optionFunctions?.map((of: FunctionOption) => ({
                label: of.name,
                value: of.id,
            })) ?? []
        );
    }, [optionFunctions]);

    // Show option error only once (avoid toast in render)
    useEffect(() => {
        if (isOptionError) {
            toast.error((errorOption as any)?.data?.message ?? "Có lỗi xảy ra");
        }
    }, [isOptionError, errorOption]);

    // Show detail error only once
    useEffect(() => {
        if (isDetailError) {
            toast.error((detailError as any)?.data?.message ?? "Không tải được dữ liệu");
        }
    }, [isDetailError, detailError]);

    // When detail loaded -> fill form
    useEffect(() => {
        if (!subFunctionDetail) return;
        console.log(subFunctionDetail);
        
        // Tùy response backend của bạn: subFunctionDetail.data hay subFunctionDetail
        // Nếu ApiResponse: { success, message, data }
        const item = (subFunctionDetail as any)?.data ?? subFunctionDetail;

        reset({
            id: item?.id ?? "",
            name: item?.name ?? "",
            code: item?.code ?? "",
            description: item?.description ?? "",
            // Nếu backend trả functionId sẵn thì dùng luôn.
            // Nếu backend trả function object: item.function?.id
            functionId:  item?.function?.id ?? null,
        });
    }, [subFunctionDetail, reset]);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const onSubmit: SubmitHandler<SubFunctionForm> = async (data) => {
        if (!id) return;
        try {
            // thường edit không cho sửa id -> vẫn gửi id để backend biết update record nào
            const res = await updateSubFunction({ id: id, body: data }).unwrap();
            setIsRedirecting(true);
            toast.success(res.message ?? "Cập nhật thành công");

            setTimeout(() => {
                navigate("/subfunctions", { replace: true });
            }, 1500);
        } catch (error: any) {
            toast.error(error?.data?.message ?? "Có lỗi xảy ra");
        }
    };

    const isBusy = isDetailLoading || isUpdating || isRedirecting;

    return (
        <div className="d-flex justify-content-center mt-5">
            <div className="border-app--rounded bg-white" style={{ minWidth: "500px" }}>
                <div className="d-flex align-items-center justify-content-between py-3 px-4 my-2 border-bottom">
                    <div>
                        <div className="fw-bold fs-6">Cập nhật chức năng con</div>
                        <div className="f-body-3xs">
                            Chỉnh sửa quyền cụ thể trong một mô-đun.
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <button onClick={() => navigate(-1)} className="btn-app btn-app--sm btn-app--ghost">
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isBusy}
                            form="subfunction-form"
                            className="btn-app btn-app btn-app--sm btn-app--default"
                        >
                            <RiSave3Line />
                            <span>Lưu</span>
                        </button>
                    </div>
                </div>

                <form
                    id="subfunction-form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="py-3 px-4 form-app mb-5"
                >
                    {/* Optional loading text */}
                    {isDetailLoading && (
                        <SubFunctionSkeleton />
                    )}

                    <div className="mb-5">
                        <div>Chức năng:</div>
                        <div className="f-body-3xs mb-2">Quyền này thuộc về mô-đun hệ thống nào?</div>

                        <Controller
                            name="functionId"
                            control={control}
                            render={({ field }) => (
                                <Select<Option, false>
                                    options={options}
                                    value={options.find((o) => o.value === field.value) ?? null}
                                    isClearable
                                    isDisabled={isBusy}
                                    isLoading={isOptionLoading}
                                    onChange={(opt) => field.onChange(opt?.value ?? null)}
                                    placeholder="Chọn chức năng"
                                    components={{ IndicatorSeparator: null }}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                />
                            )}
                        />
                    </div>

                    <Row>
                        <Col hidden>
                            <label htmlFor="ID">
                                ID quyền hạn: <span className="text-danger">*</span>
                            </label>

                            {/* Thường edit không cho sửa ID */}
                            <input
                                {...register("id", {
                                    required: { value: true, message: "Id không được để trống." },
                                })}
                                disabled={true}
                                type="text"
                                id="ID"
                                className="form-control form-control-sm"
                                placeholder="Ví dụ: VIEW_FUNCTION"
                            />
                            {errors.id && (
                                <span className="form-message-error">{errors.id?.message}</span>
                            )}
                        </Col>
                        <Col>
                            <label htmlFor="code">
                                Mã quyền hạn: <span className="text-danger">*</span>
                            </label>

                            {/* Thường edit không cho sửa ID */}
                            <input
                                {...register("code", {
                                    required: { value: true, message: "Mã quyền hạn không được để trống." },
                                })}
                                type="text"
                                id="code"
                                className="form-control form-control-sm"
                                placeholder="Ví dụ: VIEW_FUNCTION"
                            />
                            {errors.code && (
                                <span className="form-message-error">{errors.code?.message}</span>
                            )}
                        </Col>
                        <Col>
                            <label htmlFor="NAME">
                                Tên quyền hạn: <span className="text-danger">*</span>
                            </label>
                            <input
                                {...register("name", {
                                    required: { value: true, message: "Tên không được để trống." },
                                })}
                                disabled={isBusy}
                                type="text"
                                id="NAME"
                                className="form-control form-control-sm"
                                placeholder="Ví dụ: Xem chi tiết"
                            />
                            {errors.name && (
                                <span className="form-message-error">{errors.name?.message}</span>
                            )}
                        </Col>
                    </Row>

                    <div>
                        <label htmlFor="description">
                            Mô tả: <span className="text-danger">*</span>
                        </label>
                        <textarea
                            {...register("description", {
                                required: { value: true, message: "Mô tả không được để trống." },
                            })}
                            disabled={isBusy}
                            id="description"
                            className="form-control"
                            placeholder="Mô tả trách nhiệm..."
                        />
                        {errors.description && (
                            <span className="form-message-error">
                                {errors.description?.message}
                            </span>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubFunctionEdit;
