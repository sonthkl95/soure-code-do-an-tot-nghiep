import React, { useEffect, useMemo, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { RiSave3Line } from "react-icons/ri";
import AccordionSelect, { type Section } from "../../components/common/AccordionSelect";
import { useGetAllFunctionsQuery } from "../../features/functions/function.api";
import { toSection } from "../../types/function.type";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";

// ✅ đổi các import này theo project của bạn
import { useGetRoleByIdQuery, useUpdateRoleMutation } from "../../features/roles/role.api";

type RoleInput = {
    id: string;
    code: string;
    name: string;
    description: string;
};

const RoleEdit = () => {
    const { id: roleIdParam } = useParams<{ id: string }>();
    const navigate = useNavigate();

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
    } = useGetRoleByIdQuery(roleIdParam!, {
        skip: !roleIdParam,
    });

    // ===== Form =====
    const {
        register,
        formState: { errors },
        handleSubmit,
        reset,
    } = useForm<RoleInput>();

    // ===== Selected permissions =====
    const [selected, setSelected] = useState<string[]>([]);
    const [selectedBase, setSelectedBase] = useState<string[]>([]); // mảng gốc để so sánh (edit page)

    const [disabledForm, setDisabledForm] = useState<boolean>(false);

    const [updateRole] = useUpdateRoleMutation();
    const baseSelected = useMemo<string[]>(
        () => roleDetail?.subFunctions ?? [],
        [roleDetail]
    );
    // ===== Khi load roleDetail xong: fill form + set selected =====
    useEffect(() => {
        if (!roleDetail) return;

        // tuỳ shape backend: roleDetail.id / roleDetail.data.id ...
        const id = roleDetail.id ?? "";
        const code = roleDetail.code ?? "";
        const name = roleDetail.name ?? "";
        const description = roleDetail.description ?? "";
        const subFunctions: string[] =
            roleDetail.subFunctions ?? [];
        console.log(roleDetail);
        
        reset({
            id,
            name,
            description,
            code
        });

        setSelectedBase(subFunctions);
    }, [roleDetail, reset]);
    useEffect(() => {
        if (selected.length === 0 && baseSelected.length > 0) {
            setSelected(baseSelected);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseSelected]);
    // ===== Submit =====
    const onSubmit: SubmitHandler<RoleInput> = async (data) => {
        const id = data.id.trim();
        const code = data.code.trim();
        const name = data.name.trim();
        const description = data.description.trim();
        if (roleIdParam != null) {
            try {
                setDisabledForm(true);
                console.log(id);
                
                // ✅ tuỳ backend: thường update không cho sửa id, nhưng mình vẫn gửi id theo bạn đang form
                const res = await updateRole({
                    id: roleIdParam, body: {
                        id: id,
                        code,
                        name,
                        description,
                        subFunctions: selected,
                    }
                }).unwrap();

                toast.success(res.message ?? "Cập nhật vai trò thành công");
                setTimeout(() => {
                    navigate("/roles", { replace: true });
                    setDisabledForm(false);
                }, 1500);
            } catch (error: any) {
                console.log(error);

                setDisabledForm(false);
                toast.error(error?.data?.message ?? "Có lỗi xảy ra");
            }
        }
    };

    // ===== Loading/Error UI tối thiểu (giữ style) =====
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
                    <button onClick={() => navigate(-1)} className="btn-app btn-app--sm btn-app--ghost">
                        Hủy
                    </button>
                    <button
                        type="submit"
                        form="role-form"
                        className="btn-app btn-app btn-app--sm btn-app--default"
                        disabled={disabledForm}
                    >
                        <RiSave3Line />
                        <span>Lưu</span>
                    </button>
                </div>
            </div>

            <Row className="g-4">
                <Col lg={4}>
                    <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="form-app p-2">
                        <div hidden>
                            <label htmlFor="id">
                                Mã vai trò: <span className="text-danger">*</span>
                            </label>

                            {/* Thường edit không cho sửa ID => disabled */}
                            <input
                                disabled={true}
                                {...register("id")}
                                type="text"
                                id="id"
                                className="form-control form-control-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="code">
                                Mã vai trò: <span className="text-danger">*</span>
                            </label>

                            {/* Thường edit không cho sửa ID => disabled */}
                            <input
                                {...register("code", {
                                    required: { value: true, message: "Mã không được để trống." },
                                })}
                                type="text"
                                id="code"
                                className="form-control form-control-sm"
                                placeholder="Ví dụ: ROLE_EXAMPLE"
                            />
                            {errors.code && <span className="form-message-error">{errors.code?.message}</span>}
                        </div>

                        <div>
                            <label htmlFor="name">
                                Tên vai trò: <span className="text-danger">*</span>
                            </label>
                            <input
                                disabled={disabledForm}
                                {...register("name", {
                                    required: { value: true, message: "Tên không được để trống." },
                                })}
                                type="text"
                                id="name"
                                className="form-control form-control-sm"
                                placeholder="Ví dụ: Khách hàng..."
                            />
                            {errors.name && <span className="form-message-error">{errors.name?.message}</span>}
                        </div>

                        <div>
                            <label htmlFor="description">
                                Mô tả: <span className="text-danger">*</span>
                            </label>
                            <textarea
                                disabled={disabledForm}
                                {...register("description", {
                                    required: { value: true, message: "Mô tả không được để trống." },
                                })}
                                id="description"
                                className="form-control"
                                placeholder="Mô tả trách nhiệm..."
                            />
                            {errors.description && (
                                <span className="form-message-error">{errors.description?.message}</span>
                            )}
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

                        {/* Optional: show thay đổi so với base */}
                        <div className="d-flex align-items-center justify-content-between mt-2">
                            <span className="f-body-2xs">Thay đổi:</span>
                            <span className="d-inline-block bg-white py-1 px-2 app-radius__sm f-body-xs">
                                {selected.filter((x) => !selectedBase.includes(x)).length} thêm /{" "}
                                {selectedBase.filter((x) => !selected.includes(x)).length} bỏ
                            </span>
                        </div>
                    </div>
                </Col>

                <Col>
                    <div className="d-flex align-items-center justify-content-between">
                        <span className="f-section">Cấu hình quyền</span>
                        <span className="f-micro">Chọn các chức năng mà vai trò này có thể truy cập.</span>
                    </div>

                    <div className="d-flex flex-column gap-2">
                        <AccordionSelect
                            disabled={disabledForm}
                            sections={sections}
                            value={selected}
                            selectedValue={selectedBase} // ✅ mảng gốc để so sánh (edit)
                            onChange={setSelected}
                        />
                    </div>
                </Col>
            </Row>
        </div>
    );
};

export default RoleEdit;
