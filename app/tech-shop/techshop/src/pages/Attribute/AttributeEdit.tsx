import {
  RiSave3Line,
} from "react-icons/ri";
import { Controller, useForm, useFieldArray, useWatch, type SubmitHandler, FormProvider } from "react-hook-form"
import { useNavigate, useParams } from "react-router"
import Select from "react-select"
import { type Option } from "../../types/select.type";
import type { AttributeEditForm, AttributeFormUI, OptionAttributeUI } from "../../types/attribute.type";
import { useEditAttributeMutation, useGetAttributeByIdQuery, useRevokeAttributeOptionMutation } from "../../features/attribute/attribute.api";
import { toast } from "react-toastify";
import { useEffect } from "react";
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import { hasText } from "../../utils/string";
import { PiEyeSlashThin, PiEyeThin } from "react-icons/pi";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableRow from "./SortableRow";
import { TbArrowBackUpDouble } from "react-icons/tb";
import isEqual from "lodash/isEqual";
const options: Option[] = [
  { value: "TEXT", label: "Văn bản" },
  { value: "NUMBER", label: "Số" },
  { value: "BOOLEAN", label: "Bật/Tắt" },
  { value: "SELECT", label: "Lựa chọn đơn" },
  { value: "MULTI_SELECT", label: "Lựa chọn nhiều" },
  { value: "DATE", label: "Chọn thời gian" },
]
type OptionUI = NonNullable<AttributeFormUI["options"]>[number];
const AttributeEdit = () => {

  const navigate = useNavigate();
  const { id: attributeId } = useParams<{ id: string }>()
  const methods = useForm<AttributeFormUI>({
    defaultValues: {
      id: "",
      code: "",
      dataType: "",
      unit: "",
      options: undefined,
    }
  })
  const { register, getValues, formState: { errors }, handleSubmit, reset, control, setValue, clearErrors } = methods;
  const { data: attributeDetail, isLoading: isLoadingDetail } = useGetAttributeByIdQuery(attributeId!, { skip: !attributeId })

  useEffect(() => {
    if (!attributeDetail) return;
    console.log(attributeDetail);

    reset({
      id: attributeDetail.id,
      code: attributeDetail.code,
      label: attributeDetail.label,
      active: attributeDetail.active,
      dataType: attributeDetail.dataType,
      unit: attributeDetail.unit,
      options: attributeDetail.options,
      deleted: attributeDetail.deleted,
      usage: attributeDetail.usage,
      capabilities: attributeDetail.capabilities
    })
  }, [attributeDetail, reset])


  const [editAttribute, { isLoading: isEditing }] = useEditAttributeMutation()
  const [revokeOption, { isLoading: isRevokeOption }] = useRevokeAttributeOptionMutation();
  const dataType = useWatch({ control, name: "dataType" });
  const isNumber = dataType === "NUMBER";
  const isSelect = dataType === "SELECT" || dataType === "MULTI_SELECT";
  const { fields, append, remove, move, update } = useFieldArray({
    control,
    name: "options",
    keyName: "optionId"
  });
  const normalizeExistingById = (options: OptionAttributeUI[]) =>
    options
      .filter(o => !!o.id) // chỉ những cái có id
      .map(o => ({
        id: o.id!, // safe do filter
        label: (o.label ?? "").trim(),     // giữ rỗng để bắt case user xoá trắng
        active: o.active ?? true,
        deprecated: !!o.deprecated,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
  const hasNewTypedOption = (options: OptionAttributeUI[]) =>
    options.some(o => !hasText(o.id) && hasText(o.label));
  const hasUserChangedOptions = (oldOptions: OptionAttributeUI[], newOptions: OptionAttributeUI[]) => {
    const oldExisting = normalizeExistingById(oldOptions);
    const newExisting = normalizeExistingById(newOptions);
    // 1) so phần có id (chi tiết)
    if (!isEqual(oldExisting, newExisting)) return true;

    // 2) nếu có option mới (không id) mà user đã gõ label => coi là changed
    if (hasNewTypedOption(newOptions)) return true;

    return false;
  };
  const onDataTypeChangeCleanup = (next: string | null) => {
    if (next !== "NUMBER") {
      setValue("unit", "");
      clearErrors("unit");
    }
    if (next !== "SELECT" && next !== "MULTI_SELECT") {
      clearErrors("options");
    }
    if ((next == "SELECT" || next == "MULTI_SELECT") && next == attributeDetail?.dataType && !hasUserChangedOptions(attributeDetail?.options ?? [], getValues("options"))) {
      setValue("options", attributeDetail?.options ?? [])
    }
  };
  const active = useWatch({
    control,
    name: "active"
  })
  const normalizeOptions = (arr?: OptionAttributeUI[]) =>
    (arr ?? [])
      .filter(x => hasText(x.label))
      .map(x => ({ id: x.id, label: x.label?.trim(), active: x.active, displayOrder: x.displayOrder, deprecated: x.deprecated }))
  const onSubmit: SubmitHandler<AttributeFormUI> = async (data: AttributeFormUI) => {
    try {
      const isSelect = data.dataType === "SELECT" || data.dataType === "MULTI_SELECT";
      const cleanedOptions = isSelect ? normalizeOptions(data.options) : [];
      if (isSelect && cleanedOptions.length === 0) {
        toast.error("Cần ít nhất 1 lựa chọn hợp lệ (value + label).");
        return;
      }
      const payload: AttributeEditForm = {
        id: data.id ?? "",
        label: data.label,
        dataType: data.dataType,
        active: data.active,
        code: data.code ?? "",
        options: cleanedOptions, // SELECT/MULTI_SELECT thì array sạch, còn lại null
        unit: data.dataType === "NUMBER" ? data.unit?.trim() : null,
      };
      const res = await editAttribute({ id: attributeId ?? "", body: payload }).unwrap()
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
  const capabilities = useWatch({
    control,
    name: "capabilities"
  })
  const handleRevokeOption = async (attributeId: string, optionId: string) => {
    if (!hasText(attributeId) || !hasText(optionId)) {
      toast.error("Dữ liệu không hợp lệ")
      return;
    }
    try {
      await revokeOption({ attributeId, optionId })
    } catch (error) {
      console.log(error);
      toast.error("Không thể cập nhật option")
    }
  }

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
              <button type='submit' disabled={isEditing} form='subfunction-form' className='btn-app btn-app btn-app--sm btn-app--default'>
                <RiSave3Line />
                <span>Lưu</span>
              </button>
            </div>
          </div>
          <form id="subfunction-form" onSubmit={handleSubmit(onSubmit)} className="py-3 px-4 mb-5">
            <fieldset disabled={isEditing || isLoadingDetail}>

              <div className="form-app row flex-row gap-0 gy-4">
                <div className="col-6">
                  <label className="form-label" htmlFor="name">Tên hiển thị: <span className="text-danger">*</span></label>
                  <input {...register("label", {
                    required: {
                      value: true,
                      message: "Tên hiển thị không được để trống."
                    }
                  })} disabled={!capabilities?.canEditLabel} type="text" id='name' className='form-control form-control-sm' placeholder='Ví dụ: RAM' />
                  {errors.label && <span className='form-message-error'>{errors.label?.message}</span>}
                </div>
                <div className="col-6">
                  <label className="form-label" htmlFor="code">Mã thuộc tính: <span className="text-danger">*</span></label>
                  <input {...register("code", {
                    required: {
                      value: true,
                      message: "Mã thuộc tính không được để trống."
                    }
                  })} disabled={!capabilities?.canChangeCode} type="text" id='code' className='form-control form-control-sm' placeholder='Ví dụ: RAM' />
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
                        id="dataType"
                        options={options}
                        value={options.find((o) => o.value === field.value) ?? null}
                        isClearable
                        isDisabled={!capabilities?.canChangeDataType}
                        onChange={(opt) => {
                          const next = opt?.value ?? null;
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
                          indicatorsContainer: (base) => ({ ...base, height: 32 }),
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
                    })} type="text" id='code' className='form-control form-control-sm' placeholder='Ví dụ: GB' />
                    {errors.unit && <span className='form-message-error'>{errors.unit?.message}</span>}
                  </div>
                )}
                <div className="col-12 d-flex align-items-end">
                  <button disabled={!capabilities?.canToggleActive} className={`d-flex align-items-center gap-2 btn-app ${active ? "btn-app--active" : "btn-app--destructive"}`} type="button" onClick={() => setValue("active", !active)}>
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
                      disabled={!capabilities?.canAddOptions}
                      className="btn-app btn-app--sm btn-app--ghost"
                      onClick={() => append({ id: "", label: "", active: true, displayOrder: fields.length })}
                    >
                      + Thêm dòng
                    </button>
                  </div>

                  <div className="table-responsive table-card--sm">
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext
                        items={fields.filter(f => !f.deprecated).map((f) => f.optionId)}
                        strategy={verticalListSortingStrategy}
                      >
                        <table className="table-app align-middle">
                          <colgroup>
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "60%" }} />
                            <col style={{ width: "30%" }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th scope="col">Sắp xếp</th>
                              <th scope="col">Giá trị</th>
                              <th scope="col" className="text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fields.filter(f => !f.deprecated).map((f, idx) => (
                              <SortableRow key={f.optionId} onUpdate={(newVal) => onUpdate(idx, newVal)} onRemove={remove} id={f.optionId} index={idx} />
                            ))}
                          </tbody>
                        </table>
                      </SortableContext>
                    </DndContext>
                  </div>
                  {fields.some(f => f.deprecated) && (
                    <div className="form-app mt-4">
                      <div className="form-label mb-0">Danh sách đã xóa:</div>
                      <div className="table-responsive table-card--sm">
                        <table className="table-app">
                          <colgroup>
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "60%" }} />
                            <col style={{ width: "30%" }} />
                          </colgroup>
                          <thead>
                            <tr>
                              <th scope="col">STT</th>
                              <th scope="col">Giá trị</th>
                              <th scope="col" className="text-center">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {fields.filter(f => f.deprecated).map((f, idx) => (
                              <tr key={f.id} className="w-100">
                                <td >{idx + 1}</td>
                                <td>{f.label}</td>
                                <td>
                                  <div className="d-flex justify-content-center align-items-center">
                                    <button onClick={() => handleRevokeOption(getValues("id") ?? "", f.id ?? "")} type="button" className="action-btn" >
                                      <TbArrowBackUpDouble />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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

export default AttributeEdit