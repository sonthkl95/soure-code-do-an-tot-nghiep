import {
    RiDeleteBin6Line,
    RiSave3Line,
} from "react-icons/ri";
import { Controller, useForm, useFieldArray, useWatch, type SubmitHandler, FormProvider } from "react-hook-form"
import { useNavigate } from "react-router"
import Select from "react-select"
import { type Option } from "../../types/select.type";
import type { AttributeCreateForm, AttributeFormUI, OptionAttributeCreate } from "../../types/attribute.type";
import { useCreateAttributeMutation } from "../../features/attribute/attribute.api";
import { toast } from "react-toastify";
import { hasText } from "../../utils/string";
import { PiEyeSlashThin, PiEyeThin } from "react-icons/pi";
import SortableRow from "./SortableRow";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

const options: Option[] = [
    { value: "TEXT", label: "Văn bản" },
    { value: "NUMBER", label: "Số" },
    { value: "BOOLEAN", label: "Bật/Tắt" },
    { value: "SELECT", label: "Lựa chọn đơn" },
    { value: "MULTI_SELECT", label: "Lựa chọn nhiều" },
    { value: "DATE", label: "Chọn thời gian" },
]
type OptionUI = NonNullable<AttributeFormUI["options"]>[number];
const AttributeCreate = () => {
    const navigate = useNavigate();
    const methods = useForm<AttributeFormUI>({
        defaultValues: {
            dataType: "",
            unit: "",
            active: true,
            options: undefined,
        }
    })
    const { control, setValue, clearErrors, register, handleSubmit, formState: { errors } } = methods;
    const [createAttribute, { isLoading: isCreating }] = useCreateAttributeMutation()
    const dataType = useWatch({ control, name: "dataType" });
    const isNumber = dataType === "NUMBER";
    const isSelect = dataType === "SELECT" || dataType === "MULTI_SELECT";
    const { fields, append, remove, move, update } = useFieldArray({
        control,
        name: "options",
        keyName: "optionId"
    });
    const onDataTypeChangeCleanup = (next: string | null) => {
        if (next !== "NUMBER") {
            setValue("unit", "");
            clearErrors("unit");
        }
        if (next !== "SELECT" && next !== "MULTI_SELECT") {
            setValue("options", []);
            clearErrors("options");
        }
    };
    const active = useWatch({
        control,
        name: "active"
    })
    const normalizeOptions = (arr?: OptionAttributeCreate[]) =>
        (arr ?? [])
            .filter(x => hasText(x.label))
            .map(x => ({ label: x.label?.trim(), active: x.active, displayOrder: x.displayOrder }))
    const onSubmit: SubmitHandler<AttributeFormUI> = async (data: AttributeFormUI) => {
        try {
            const isSelect = data.dataType === "SELECT" || data.dataType === "MULTI_SELECT";
            const cleanedOptions = isSelect ? normalizeOptions(data.options) : [];
            if (isSelect && cleanedOptions.length === 0) {
                toast.error("Cần ít nhất 1 lựa chọn hợp lệ giá trị).");
                return;
            }
            const payload: AttributeCreateForm = {
                ...data,
                options: cleanedOptions, // SELECT/MULTI_SELECT thì array sạch, còn lại null
                unit: data.dataType === "NUMBER" ? data.unit?.trim() : null,
            };
            const res = await createAttribute(payload).unwrap()
            toast.success(res.message)
            setTimeout(() => {
                navigate("/attributes", { replace: true })
            }, 1500);
        } catch (error: any) {
            toast.error(error?.data?.message ?? "Có lỗi xảy ra")
        }
    };
    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (!over || active.id === over.id) return;

        const oldIndex = fields.findIndex((f) => f.optionId === active.id);
        const newIndex = fields.findIndex((f) => f.optionId === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        // ✅ RHF-aware reorder
        move(oldIndex, newIndex);
    };
    const onUpdate = (index: number, patch: Partial<OptionUI>) => {
        const current = fields[index] as OptionUI; // fields có thêm field.id, nhưng ok
        update(index, { ...current, ...patch });
    };
    return (
        <FormProvider {...methods} >
            <div className="d-flex justify-content-center mt-5">
                <div className="border-app--rounded bg-white" style={{ width: "600px" }}>
                    <div className='d-flex align-items-center justify-content-between py-3 px-4 my-2 border-bottom'>
                        <div>
                            <div className="fw-bold fs-6">Tạo thuộc tính mới</div>
                            <div className="f-body-3xs">Định nghĩa trường dữ liệu kỹ thuật cho sản phẩm.</div>
                        </div>
                        <div className='d-flex align-items-center gap-2'>
                            <button onClick={() => navigate(-1)} className='btn-app btn-app--sm btn-app--ghost' >Hủy</button>
                            <button type='submit' disabled={isCreating} form='subfunction-form' className='btn-app btn-app btn-app--sm btn-app--default'>
                                <RiSave3Line />
                                <span>Lưu</span>
                            </button>
                        </div>
                    </div>
                    <form id="subfunction-form" onSubmit={handleSubmit(onSubmit)} className="py-3 px-4 mb-5">
                        <fieldset disabled={isCreating}>

                            <div className="form-app row flex-row gap-0 gy-4">
                                <div className="col-6">
                                    <label className="form-label" htmlFor="name">Tên hiển thị: <span className="text-danger">*</span></label>
                                    <input {...register("label", {
                                        required: {
                                            value: true,
                                            message: "Tên hiển thị được để trống."
                                        }
                                    })} disabled={isCreating} type="text" id='name' className='form-control form-control-sm' placeholder='Ví dụ: RAM' />
                                    {errors.label && <span className='form-message-error'>{errors.label?.message}</span>}
                                </div>


                                <div className="col-6">
                                    <label className="form-label" htmlFor="dataType">Kiểu dữ liệu: <span className="text-danger">*</span></label>

                                    <Controller
                                        name="dataType"
                                        control={control}
                                        defaultValue={""}
                                        rules={{
                                            required: {
                                                value: true,
                                                message: "Kiểu dữ liệu không được để trống."
                                            }
                                        }}
                                        render={({ field }) => (
                                            <Select<Option, false>
                                                options={options}
                                                value={options.find((o) => o.value === field.value) ?? null}
                                                isClearable
                                                isDisabled={isCreating}
                                                onChange={(opt) => {
                                                    const next = (opt?.value ?? null) as any;
                                                    field.onChange(next);
                                                    onDataTypeChangeCleanup(next);
                                                }}
                                                placeholder="Chọn kiểu dữ liệu"
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
                                    {errors.dataType && <span className='form-message-error'>{errors.dataType?.message}</span>}

                                </div>
                                {isNumber && (
                                    <div className="col-6">
                                        <label className="form-label" htmlFor="unit">Đơn vị: <span className="text-danger">*</span></label>
                                        <input {...register("unit", {
                                            required: {
                                                value: true,
                                                message: "Đơn vị được để trống."
                                            }
                                        })} disabled={isCreating} type="text" id='code' className='form-control form-control-sm' placeholder='Ví dụ: GB' />
                                        {errors.unit && <span className='form-message-error'>{errors.unit?.message}</span>}
                                    </div>
                                )}
                                <div className="col-12 d-flex align-items-end">
                                    <button className={`d-flex align-items-center gap-2 btn-app ${active ? "btn-app--active" : "btn-app--destructive"}`} type="button" onClick={() => setValue("active", !active)}>
                                        {active ? (
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
                            </div>
                            {isSelect && (
                                <div className="col-12 form-app">
                                    <div className="d-flex align-items-center justify-content-between mt-4">
                                        <label className="form-label mb-0 ">
                                            Danh sách lựa chọn <span className="text-danger">*</span>
                                        </label>
                                        <button
                                            type="button"
                                            className="btn-app btn-app--sm btn-app--ghost"
                                            onClick={() => append({ label: "", active: true, displayOrder: fields.length })}
                                            disabled={isCreating}
                                        >
                                            + Thêm dòng
                                        </button>
                                    </div>

                                    <div className="table-responsive table-card--sm">
                                        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            <SortableContext
                                                items={fields.map((f) => f.optionId)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                <table className="table table-app align-middle">
                                                    <colgroup>
                                                        <col style={{ width: "10%" }} />
                                                        <col style={{ width: "60%" }} />
                                                        <col style={{ width: "30%" }} />
                                                    </colgroup>
                                                    <thead>
                                                        <tr>
                                                            <th scope="col"></th>
                                                            <th scope="col">Giá trị</th>
                                                            <th scope="col" className="text-center">Thao tác</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {fields.map((f, idx) => (

                                                            <SortableRow key={f.optionId} onUpdate={(newVal) => onUpdate(idx, newVal)} onRemove={remove} id={f.optionId} index={idx} />
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </SortableContext>
                                        </DndContext>
                                    </div>

                                    {/* Validate level "ít nhất 1 option hợp lệ" */}
                                    <input
                                        type="hidden"
                                        {...register("options", {
                                            validate: (arr) => {
                                                if (!isSelect) return true;
                                                if (!arr || arr.length === 0) return "Cần ít nhất 1 lựa chọn.";
                                                const ok = arr.every((x) => hasText(x.label));
                                                return ok || "Tất cả lựa chọn phải có Value và Label.";
                                            },
                                        })}
                                    />
                                    {errors.options && typeof errors.options.message === "string" && (
                                        <span className="form-message-error">{errors.options.message}</span>
                                    )}
                                </div>
                            )}
                        </fieldset>
                    </form>
                </div>
            </div>
        </FormProvider>
    )
}

export default AttributeCreate