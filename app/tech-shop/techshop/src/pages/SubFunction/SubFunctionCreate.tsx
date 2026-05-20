import { Col, Row } from "react-bootstrap"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import { RiSave3Line } from "react-icons/ri"
import { useNavigate } from "react-router"
import { useGetFunctionOptionsQuery } from "../../features/functions/function.api"
import { toast } from "react-toastify"
import type { FunctionOption } from "../../types/function.type"
import Select from 'react-select';
import { useCreateSubFunctionMutation } from "../../features/subfunction/subfunction.api"
import type { SubFunctionCreateForm } from "../../types/subFunction.type"
import { useEffect } from "react"
type Option = {
    label: string,
    value: string
}


const SubFunctionCreate = () => {
    const navigate = useNavigate()
    const { register, formState: { errors }, handleSubmit, control } = useForm<SubFunctionCreateForm>({
        defaultValues: { functionId: null }
    })
    const {
        data: optionFunctions,
        isLoading: isOptionLoading,
        isError: isOptionError,
        error: errorOption
    } = useGetFunctionOptionsQuery(null);
    const [createSubFunction, { isLoading: isCreating }] = useCreateSubFunctionMutation()


    const onSubmit: SubmitHandler<SubFunctionCreateForm> = async (data: SubFunctionCreateForm) => {
        try {
            const res = await createSubFunction(data).unwrap()
            toast.success(res.message)
            setTimeout(() => {
                navigate("/subfunctions", { replace: true })
            }, 1500);
        } catch (error: any) {
            toast.error(error?.data?.message ?? "Có lỗi xảy ra")
        }
    };
    useEffect(() => {
        if (isOptionError) {
            toast.error((errorOption as any)?.data?.message ?? "Có lỗi xảy ra");
        }
    }, [isOptionError, errorOption]);
    const options: Option[] = optionFunctions?.map((of: FunctionOption) => ({ label: of.name, value: of.id })) ?? [];
    return (
        <div className="d-flex justify-content-center mt-5">
            <div className="border-app--rounded bg-white" style={{ minWidth: "500px" }}>
                <div className='d-flex align-items-center justify-content-between py-3 px-4 my-2 border-bottom'>
                    <div>
                        <div className="fw-bold fs-6">Tạo chức năng con</div>
                        <div className="f-body-3xs">Xác định một khả năng hoặc quyền cụ thể trong một mô-đun.</div>
                    </div>
                    <div className='d-flex align-items-center gap-2'>
                        <button onClick={() => navigate(-1)} className='btn-app btn-app--sm btn-app--ghost' >Hủy</button>
                        <button type='submit' disabled={isCreating} form='subfunction-form' className='btn-app btn-app btn-app--sm btn-app--default'>
                            <RiSave3Line />
                            <span>Lưu</span>
                        </button>
                    </div>
                </div>
                <form id="subfunction-form" onSubmit={handleSubmit(onSubmit)} className="py-3 px-4 form-app mb-5">
                    <div className="mb-5">
                        <div className="fw-bold">Chức năng:</div>
                        <div className="f-body-3xs mb-2">Quyền này thuộc về mô-đun hệ thống nào?</div>
                        <Controller
                            name="functionId"
                            control={control}
                            defaultValue={null}
                            render={({ field }) => (
                                <Select<Option, false>
                                    options={options}
                                    value={options.find((o) => o.value === field.value) ?? null}
                                    isClearable
                                    isDisabled={isCreating}
                                    isLoading={isOptionLoading}
                                    onChange={(opt) => field.onChange(opt?.value ?? null)}
                                    placeholder="Chọn chức năng"
                                    components={{
                                        IndicatorSeparator: null
                                    }}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    styles={{
                                        control: (base) => ({ ...base, minHeight: 34 }),
                                        valueContainer: (base) => ({ ...base, paddingTop: 0, paddingBottom: 0 }),
                                        indicatorsContainer: (base) => ({ ...base, height: 34 }),
                                    }}
                                />
                            )}
                        />
                    </div>
                    <Row>
                        <Col>
                            <label htmlFor="code">Mã quyền hạn: <span className="text-danger">*</span></label>
                            <input {...register("code", {
                                required: {
                                    value: true,
                                    message: "Mã quyền hạn không được để trống."
                                }
                            })} disabled={isCreating} type="text" id='code' className='form-control form-control-sm' placeholder='Ví dụ: VIEW_FUNCTION' />
                            {errors.code && <span className='form-message-error'>{errors.code?.message}</span>}
                        </Col>
                        <Col>
                            <label htmlFor="name">Tên quyền hạn: <span className="text-danger">*</span></label>
                            <input {...register("name", {
                                required: {
                                    value: true,
                                    message: "Tên không được để trống."
                                }
                            })} disabled={isCreating} type="text" id='name' className='form-control form-control-sm' placeholder='Ví dụ: Xem chi tiết' />
                            {errors.name && <span className='form-message-error'>{errors.name?.message}</span>}
                        </Col>
                    </Row>
                    <div>
                        <label htmlFor="description">Mô tả: <span className="text-danger">*</span></label>
                        <textarea {...register("description", {
                            required: {
                                value: true,
                                message: "Mô tả không được để trống."
                            }
                        })} disabled={isCreating} id='description' className='form-control' placeholder='Mô tả trách nhiệm...' />
                        {errors.description && <span className='form-message-error'>{errors.description?.message}</span>}
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SubFunctionCreate