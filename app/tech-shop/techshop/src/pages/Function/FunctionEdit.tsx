import {
  RiDeleteBin4Line,
  RiEditLine,
  RiSaveLine,
} from "react-icons/ri"
import { FiLayers, FiPlus, FiSearch } from "react-icons/fi"
import { useNavigate, useParams } from "react-router"
import Select from "react-select"
import { Controller, useForm, type SubmitHandler } from "react-hook-form"
import type { FunctionEntity } from "../../types/function.type"
import { optionIcons } from "../../features/data/icon.data"
import type { IconOption } from "../../features/data/icon.data"
import { useEffect, useMemo, useState } from "react"
import {
  useCreateSubFunctionMutation,
  useGetSubFunctionOptionsMutation,
  useUpdateSubFunctionMutation,
} from "../../features/subfunction/subfunction.api"
import { useDebounce } from "../../hooks/useDebounce"
import type { SubFunctionCreateForm, SubFunctionEditForm } from "../../types/subFunction.type"
import { Modal } from "react-bootstrap"
import { toast } from "react-toastify"

import {
  useGetFunctionByIdQuery,
  useUpdateFunctionMutation,
} from "../../features/functions/function.api"
import { Control, SingleValue, Option} from "../../configs/select.config"
import { selectStyles } from "../../features/data/select.data"

type OptionSelect = {
  label: string
  value: string
  name: string
  description: string
}

const FunctionEdit = () => {
  const navigate = useNavigate()
  const { id: functionId } = useParams<{ id: string }>()

  const {
    register,
    setValue,
    watch,
    formState: { errors },
    handleSubmit,
    control,
    reset,
  } = useForm<FunctionEntity>({
    defaultValues: {
      icon: null,
      subFunctions: null,
    },
  })

  // ===== Fetch function detail =====
  const {
    data: functionDetail,
    isLoading: isLoadingDetail,
    isError,
    error,
  } = useGetFunctionByIdQuery(functionId!, { skip: !functionId })

  useEffect(() => {
    if (!functionDetail) return
    console.log(functionDetail);

    // reset toàn bộ form theo data backend
    reset({
      id: functionDetail.id,
      code: functionDetail.code,
      name: functionDetail.name,
      icon: functionDetail.icon ?? null,
      sortOrder: functionDetail.sortOrder,
      description: functionDetail.description,
      subFunctions: functionDetail.subFunctions ?? [],
    })
  }, [functionDetail, reset])

  useEffect(() => {
    if (!isError) return
    toast.error((error as any)?.data?.message ?? "Không tải được dữ liệu chức năng")
  }, [isError, error])

  // ===== Update function =====
  const [updateFunction] = useUpdateFunctionMutation()

  const onSubmit: SubmitHandler<FunctionEntity> = async (data) => {
    if (!functionId) return

    try {
      // Nếu backend không cho update ID, bạn có thể loại bỏ data.id ở đây
      const res = await updateFunction({ id: functionId, body: data }).unwrap()
      toast.success(res.message ?? "Cập nhật thành công")
      setTimeout(() => {
        navigate("/functions", { replace: true })
      }, 1500)
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Có lỗi xảy ra")
    }
  }

  // ===== Icon select render =====




  // ===== SubFunctions logic (giữ giống Create) =====
  const selectedIds = watch("subFunctions")

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 500)
  const [options, setOptions] = useState<OptionSelect[]>([])
  const [selected, setSelected] = useState<OptionSelect | null>(null)
  const [searchSubFunctions, { isLoading: isSubFunctionLoading }] =
    useGetSubFunctionOptionsMutation()

  useEffect(() => {
    if (!debouncedSearch.trim()) {
      setOptions([])
      return
    }

    const run = async () => {
      const res = await searchSubFunctions({
        keyword: debouncedSearch,
        ids: selectedIds ? selectedIds.map((sl) => sl.id) : [],
      }).unwrap()
      console.log(res);

      setOptions(
        res.map((x: any) => ({
          value: x.id,
          label: `${x.code}`,
          name: x.name,
          description: x.description ?? "",
        }))
      )
    }

    run()
  }, [debouncedSearch, selectedIds, searchSubFunctions])

  const onSelect = (opt: OptionSelect | null) => {
    setSelected(null)
    if (!opt) return

    const newItem = { id: opt.value, code: opt.label, name: opt.name, description: opt.description }

    if (selectedIds && selectedIds.length > 0) {
      const indexExist = selectedIds.findIndex((s) => s.id === opt.value)
      if (indexExist === -1) {
        setValue("subFunctions", [...selectedIds, newItem], {
          shouldDirty: true,
          shouldValidate: true,
        })
      }
      return
    }

    setValue("subFunctions", [newItem], { shouldDirty: true, shouldValidate: true })
  }

  const remove = (id: string) => {
    if (selectedIds && Array.isArray(selectedIds)) {
      setValue(
        "subFunctions",
        selectedIds.filter((x) => x.id !== id),
        { shouldDirty: true, shouldValidate: true }
      )
    }
  }

  // ===== Modals create/edit subfunction =====
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [disabledForm, setDisabledForm] = useState(false)

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    formState: { errors: createErrors },
  } = useForm<SubFunctionCreateForm>({
    defaultValues: { id: "", name: "", description: "" },
  })

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<SubFunctionEditForm>({
    defaultValues: { id: "", name: "", description: "" },
  })

  const openCreate = () => {
    resetCreate({ code: "", name: "", description: "" })
    setIsCreateOpen(true)
  }
  const closeCreate = () => setIsCreateOpen(false)

  const openEdit = (id: string) => {
    const itemEdit = selectedIds?.find((x) => x.id === id)
    resetEdit({
      id,
      code: itemEdit?.code ?? "",
      name: itemEdit?.name ?? "",
      description: itemEdit?.description ?? "",
    })
    setIsEditOpen(true)
  }
  const closeEdit = () => setIsEditOpen(false)

  const [createSubFunction] = useCreateSubFunctionMutation()
  const handleCreateSubFunctionRHF: SubmitHandler<SubFunctionCreateForm> = async (data) => {
    const code = data.code.trim()
    const name = data.name.trim()
    const description = (data.description ?? "").trim()
    const exists = selectedIds?.some((x) => x.code === code)
    if (exists) {
      toast.error("Thông tin quyền hạn bị trùng")
      return
    }

    try {
      setDisabledForm(true)
      const res = await createSubFunction({ code, name, description }).unwrap()
      toast.success(res.message ?? "Tạo quyền hạn thành công")
      closeCreate()
      if (res.data) {
        setValue(
          "subFunctions",
          [...(selectedIds ?? []), { id: res.data, code, name, description }],
          { shouldDirty: true, shouldValidate: true }
        )

      }
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Có lỗi xảy ra")
    } finally {
      setDisabledForm(false)
    }
  }

  const [updateSubFunction] = useUpdateSubFunctionMutation()
  const handleEditSubFunctionRHF: SubmitHandler<SubFunctionEditForm> = async (data) => {
    const id = data.id;
    const code = data.code.trim();
    const name = data.name.trim()
    const description = (data.description ?? "").trim()

    try {
      setDisabledForm(true)
      const res = await updateSubFunction({ id, body: { id, code, name, description } }).unwrap()
      toast.success(res.message ?? "Cập nhật quyền hạn thành công")

      setValue(
        "subFunctions",
        (selectedIds ?? []).map((x) => (x.id === id ? { ...x, name, description } : x)),
        { shouldDirty: true, shouldValidate: true }
      )
      closeEdit()
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Có lỗi xảy ra")
    } finally {
      setDisabledForm(false)
    }
  }

  const iconOptions = useMemo(() => optionIcons, [])

  if (isLoadingDetail) {
    return <div className="m-4">Đang tải dữ liệu...</div>
  }

  return (
    <div className="border-app--rounded bg-white m-4 py-4">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between border-bottom px-4 pb-4">
        <div>
          <div className="fw-bold fs-6">Chỉnh sửa chức năng</div>
          <div className="f-caption">
            Cập nhật mô-đun hệ thống và các quyền khả dụng.
          </div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button
            className="btn-app btn-app--ghost btn-app--sm"
            onClick={() => navigate(-1)}
            type="button"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="function-form"
            className="btn-app btn-app--sm d-flex align-items-center gap-2"
          >
            <RiSaveLine />
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Form */}
      <form
        id="function-form"
        className="form-app px-4 pt-4"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="row gx-5 gy-4">
          {/* Tên */}
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="name">
              Tên chức năng: <span className="text-danger">*</span>
            </label>
            <input
              {...register("name", {
                required: { value: true, message: "Tên không được để trống." },
              })}
              className="form-control form-control-sm"
              id="name"
              type="text"
              placeholder="ví dụ: Phân tích"
            />
            {errors.name && (
              <span className="form-message-error">{errors.name.message}</span>
            )}
          </div>

          {/* ID (thường edit không cho sửa) */}
          <div className="col-12 col-md-6" hidden>
            <label className="form-label" htmlFor="id">
              Mã chức năng: <span className="text-danger f-micro">(Khóa duy nhất)</span>
            </label>
            <input
              {...register("id", {
                required: { value: true, message: "Mã chức năng không được để trống." },
              })}
              className="form-control form-control-sm"
              id="id"
              disabled
              readOnly
              type="text"
              placeholder="Ví dụ: EXAMPLE_MANAGEMENT"
            />
            {errors.id && (
              <span className="form-message-error">{errors.id.message}</span>
            )}
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="code">
              Mã chức năng: <span className="text-danger f-micro">(Khóa duy nhất)</span>
            </label>
            <input
              {...register("code", {
                required: { value: true, message: "Mã chức năng không được để trống." },
              })}
              className="form-control form-control-sm"
              id="code"
              type="text"
              placeholder="Ví dụ: EXAMPLE_MANAGEMENT"
            />
            {errors.code && (
              <span className="form-message-error">{errors.code.message}</span>
            )}
          </div>

          {/* Icon */}
          <div className="col-12 col-md-6">
            <label htmlFor="icon" className="form-label">
              Biểu tượng: <span className="text-danger">*</span>
            </label>
            <Controller
              name="icon"
              control={control}
              defaultValue={null}
              rules={{ required: "Biểu tượng không được để trống" }}
              render={({ field }) => (
                <>
                  <Select<IconOption, false>
                    inputId="icon"
                    value={iconOptions.find((o) => o.value === field.value) ?? null}
                    onChange={(opt) => field.onChange(opt?.value ?? null)}
                    options={iconOptions.filter((o) => o.value !== field.value)}
                    isSearchable
                    isClearable
                    placeholder="Chọn biểu tượng"
                    components={{
                      Option,
                      SingleValue,
                      DropdownIndicator: null,
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    styles={{
                      control: (base) => ({ ...base, minHeight: 34 }),
                      valueContainer: (base) => ({
                        ...base,
                        paddingTop: 0,
                        paddingBottom: 0,
                      }),
                      indicatorsContainer: (base) => ({ ...base, height: 34 }),
                    }}
                  />
                  {errors.icon && (
                    <span className="form-message-error">{errors.icon.message}</span>
                  )}
                </>
              )}
            />
          </div>

          {/* Sort order */}
          <div className="col-12 col-md-6">
            <label className="form-label" htmlFor="sortOrder">
              Thứ tự sắp xếp: <span className="text-danger">*</span>
            </label>
            <Controller
              name="sortOrder"
              control={control}
              rules={{ required: "Vui lòng nhập thứ tự chức năng" }}
              render={({ field }) => (
                <>
                  <input
                    {...field}
                    inputMode="numeric"
                    onChange={(e) => {
                      let v = e.target.value
                      v = v.replace(/\D/g, "")
                      v = v.replace(/^0+/, "")
                      v = v.slice(0, 3)
                      field.onChange(v)
                    }}
                    className="form-control form-control-sm"
                    id="sortOrder"
                    type="text"
                  />
                  {errors.sortOrder && (
                    <span className="form-message-error">{errors.sortOrder.message}</span>
                  )}
                </>
              )}
            />
          </div>

          {/* Description */}
          <div className="col-12">
            <label className="form-label" htmlFor="description">
              Mô tả: <span className="text-danger f-micro">*</span>
            </label>
            <textarea
              rows={4}
              {...register("description", {
                required: { value: true, message: "Mô tả không được để trống." },
              })}
              className="form-control form-control-sm"
              id="description"
              placeholder="Mô tả mục đích của chức năng này"
            />
            {errors.description && (
              <span className="form-message-error">{errors.description.message}</span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 border-top" />

        {/* Sub functions */}
        <div className="d-flex align-items-center justify-content-between">
          <div className="fw-bold">Chức năng con</div>

          <div className="d-flex align-items-center gap-2" style={{ maxWidth: 420, width: "100%" }}>
            <div className="position-relative flex-grow-1 form-app">
              <span
                className="position-absolute top-50 translate-middle-y"
                style={{ left: 10, opacity: 0.6 }}
              >
                <FiSearch />
              </span>

              <Select<OptionSelect>
                options={options}
                placeholder="Tìm kiếm quyền có sẵn"
                isClearable
                value={selected}
                isSearchable
                onInputChange={(v) => setSearch(v)}
                onChange={onSelect}
                noOptionsMessage={() => (search ? "Không tìm thấy" : "Nhấp để tìm")}
                isLoading={isSubFunctionLoading}
                components={{ Control, DropdownIndicator: null }}
                styles={selectStyles}
              />
            </div>

            <button
              onClick={openCreate}
              type="button"
              className="btn-app btn-app--sm d-flex align-items-center gap-2"
            >
              <FiPlus />
              Tạo mới
            </button>
          </div>
        </div>

        {selectedIds && selectedIds.length > 0 ? (
          <div style={{ minHeight: 240 }}>
            <div className="table-card--sm table-responsive">
              <table className="table table-app mb-0">
                <thead>
                  <tr>
                    <th className="col-tt">
                      <span className="ps-2 d-inline-block">TT</span>
                    </th>
                    <th className="col-id">Mã quyền hạn</th>
                    <th>Tên</th>
                    <th>Mô tả</th>
                    <th className="col-actions text-end">Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedIds.map((sl, index) => (
                    <tr key={sl.id}>
                      <td className="col-tt">
                        <span className="ps-2 d-inline-block">{index + 1}</span>
                      </td>
                      <td className="fw-600">{sl.code}</td>
                      <td className="text-muted">{sl.name}</td>
                      <td className="text-muted">{sl.description}</td>
                      <td className="col-actions">
                        <div className="action-cell">
                          <button
                            onClick={() => openEdit(sl.id)}
                            className="action-btn"
                            type="button"
                            aria-label="Edit"
                          >
                            <RiEditLine />
                          </button>
                          <button
                            onClick={() => remove(sl.id)}
                            className="action-btn action-btn--danger"
                            type="button"
                            aria-label="Delete"
                          >
                            <RiDeleteBin4Line />
                          </button>
                        </div>
                      </td>
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
            <button onClick={openCreate} type="button" className="btn-app btn-app--link p-0">
              Tạo mới ngay
            </button>
          </div>
        )}
      </form>

      {/* Create SubFunction Modal */}
      <Modal
        show={isCreateOpen}
        onHide={closeCreate}
        centered
        dialogClassName="modal-app"
        backdropClassName="modal-app-backdrop"
      >
        <Modal.Header>
          <Modal.Title>
            <span className="fw-bold fs-5">Tạo quyền hạn</span>
          </Modal.Title>
        </Modal.Header>

        <form onSubmit={handleSubmitCreate(handleCreateSubFunctionRHF)}>
          <Modal.Body bsPrefix="form-app modal-body">
            <div className="mb-3">
              <label className="form-label">
                Mã quyền <span className="text-danger">*</span>
              </label>
              <input
                disabled={disabledForm}
                className="form-control form-control-sm"
                placeholder="Ví dụ: USER_CREATE"
                {...registerCreate("code", { required: "Mã quyền hạn không được để trống" })}
              />
              {createErrors.code && (
                <span className="form-message-error">{createErrors.code.message}</span>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">
                Tên quyền <span className="text-danger">*</span>
              </label>
              <input
                disabled={disabledForm}
                className="form-control form-control-sm"
                placeholder="Ví dụ: Tạo người dùng"
                {...registerCreate("name", { required: "Tên không được để trống" })}
              />
              {createErrors.name && (
                <span className="form-message-error">{createErrors.name.message}</span>
              )}
            </div>

            <div className="mb-2">
              <label className="form-label">Mô tả</label>
              <textarea
                disabled={disabledForm}
                className="form-control form-control-sm"
                rows={3}
                placeholder="Mô tả ngắn"
                {...registerCreate("description", { required: "Mô tả không được để trống" })}
              />
              {createErrors.description && (
                <span className="form-message-error">{createErrors.description.message}</span>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <button
              type="button"
              className="btn-app btn-app--sm btn-app--ghost p-3"
              onClick={closeCreate}
            >
              Huỷ
            </button>
            <button disabled={disabledForm} type="submit" className="btn-app btn-app--sm">
              <FiPlus />
              Tạo
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Edit SubFunction Modal */}
      <Modal
        show={isEditOpen}
        onHide={closeEdit}
        centered
        dialogClassName="modal-app"
        backdropClassName="modal-app-backdrop"
      >
        <Modal.Header>
          <Modal.Title>
            <span className="fw-bold fs-5">Chỉnh sửa quyền hạn</span>
          </Modal.Title>
        </Modal.Header>

        <form onSubmit={handleSubmitEdit(handleEditSubFunctionRHF)}>
          <Modal.Body bsPrefix="form-app modal-body">
            <div className="mb-3" hidden>
              <label className="form-label">ID quyền</label>
              <input className="form-control" disabled {...registerEdit("id")} />
            </div>
            <div className="mb-3">
              <label className="form-label">
                Mã quyền: <span className="text-danger">*</span>
              </label>
              <input
                disabled={disabledForm}
                className="form-control form-control-sm"
                {...registerEdit("code", { required: "Tên không được để trống" })}
              />
              {editErrors.code && (
                <span className="form-message-error">{editErrors.code.message}</span>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">
                Tên quyền <span className="text-danger">*</span>
              </label>
              <input
                disabled={disabledForm}
                className="form-control form-control-sm"
                {...registerEdit("name", { required: "Tên không được để trống" })}
              />
              {editErrors.name && (
                <span className="form-message-error">{editErrors.name.message}</span>
              )}
            </div>

            <div className="mb-2">
              <label className="form-label">Mô tả</label>
              <textarea
                disabled={disabledForm}
                className="form-control form-control-sm"
                rows={3}
                {...registerEdit("description")}
              />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <button
              type="button"
              className="btn-app btn-app--sm btn-app--ghost p-3"
              onClick={closeEdit}
            >
              Huỷ
            </button>
            <button disabled={disabledForm} type="submit" className="btn-app btn-app--sm">
              <RiSaveLine />
              Lưu
            </button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default FunctionEdit
