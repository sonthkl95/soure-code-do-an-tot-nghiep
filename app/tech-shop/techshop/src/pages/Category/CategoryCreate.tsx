import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Select, { components } from "react-select";
import { Controller, FormProvider, useFieldArray, useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { RiSaveLine } from "react-icons/ri";

import { optionIcons } from "../../features/data/icon.data";
import type { IconOption } from "../../features/data/icon.data";
import { Control, SingleValue } from "../../configs/select.config";
import { selectStyles } from "../../features/data/select.data";

import type { AttributeConfigUI, CategoryCreateForm, CategoryOption, CategoryCreateFormUI } from "../../types/category.type";
import {
  useCreateCategoryMutation,
  useGetCategoryOptionQuery,
  useLazyGetCategoryByIdQuery,
} from "../../features/category/category.api";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { RxDashboard } from "react-icons/rx";
import { CiSettings } from "react-icons/ci";
import { useGetAttributeOptionsMutation } from "../../features/attribute/attribute.api";
import { useDebounce } from "../../hooks/useDebounce";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableAttributeItem from "./SortableAttributeItem";
import { Modal } from "react-bootstrap";
import UploadImageBox from "../../components/common/UploadImageBox";
import { FiUpload } from "react-icons/fi";
import { slugify } from "../../utils/string";
import { PiEyeSlashThin, PiEyeThin } from "react-icons/pi";

type ParentSelectOption = {
  value: string;
  label: string;

};



const CategoryCreate = () => {
  const navigate = useNavigate();

  const methods = useForm<CategoryCreateFormUI>({
    defaultValues: {
      name: "",
      slug: "",
      parentId: "",
      active: true,
      icon: "",
      imageFile: null,
      attributeConfigs: [],
    },
    shouldUnregister: false,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    watch,
    getValues,
    formState: { errors },
  } = methods;
  const { fields, move, remove, append } = useFieldArray({
    control,
    name: "attributeConfigs",
    keyName: "rhfKey"
  })

  // parent options
  const {
    data: parentData,
    isLoading: isParentLoading,
    isFetching: isParentFetching,
  } = useGetCategoryOptionQuery(null);
  // console.log(parentData);

  const parentOptions = useMemo<ParentSelectOption[]>(() => {
    const arr = (parentData ?? []) as CategoryOption[];
    return arr.map((x) => ({
      value: x.id,
      label: `${x.name} (Lv ${x.level})`,
    }));
  }, [parentData]);

  // react-select option render for icons
  const IconOptionRender = (props: any) => {
    const data = props.data as IconOption;
    const IconComp = data?.Icon;

    return (
      <components.Option {...props}>
        <div className="d-flex align-items-center gap-2">
          {IconComp ? <IconComp size={16} /> : <span style={{ width: 16 }} />}
          <span>{data?.label ?? ""}</span>
        </div>
      </components.Option>
    );
  };

  const BOOL_OPTIONS = useMemo(
    () => [
      { value: true, label: "Có" },
      { value: false, label: "Không" },
    ],
    []
  );
  const [slugAuto, setSlugAuto] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [options, setOptions] = useState<AttributeConfigUI[]>([]);
  const [selected, setSelected] = useState<AttributeConfigUI | null>(null);
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [searchAttributeOptions, { isLoading: isAttributeLoading }] = useGetAttributeOptionsMutation();
  // ✅ prevent memory leak from URL.createObjectURL
  useEffect(() => {
    if (!debouncedSearch.trim()) {
      return;
    }
    const run = async () => {
      const res = await searchAttributeOptions({
        keyword: debouncedSearch,
        attributeIds: fields ? fields.map(sl => sl.id) : [],
      }).unwrap();
      setOptions(
        res.map((x) => ({
          id: x.id,
          isRequired: false,
          isFilterable: false,
          displayOrder: 0,
          label: x.label,
          code: x.code,
          dataType: x.dataType,
          unit: x.unit,
          optionsValue: x.options.map((op) => ({ value: op.value, label: op.label, active: false, id: op.id, deprecated: op.deprecated })),
        }))
      );
    };

    run();


  }, [debouncedSearch, fields, searchAttributeOptions])

  const onSelect = (opt: AttributeConfigUI | null) => {
    setSelected(null); // reset select

    if (!opt) return;
    const exists = fields.some((f) => f.id === opt.id);
    if (exists) return;
    append({
      id: opt.id,
      isRequired: false,
      isFilterable: false,
      displayOrder: fields ? fields.length + 1 : 1,
      label: opt.label,
      code: opt.code,
      dataType: opt.dataType,
      unit: opt.unit,
      optionsValue: opt.optionsValue,
    });
  };
  const name = watch("name")
  const slug = watch("slug")
  const active = watch("active")
  useEffect(() => {
    if (!slugAuto) return;
    const next = slugify(name || "")
    if (next === slug) return;

    setValue("slug", next, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false, // ⭐ quan trọng
    });
  }, [name, slugAuto, slug, setValue])


  const onSubmit: SubmitHandler<CategoryCreateFormUI> = async (data) => {
    try {
      if (!data.imageFile) {
        setError("imageFile", {
          type: "required",
          message: "Vui lòng chọn ảnh danh mục",
        });
        toast.error("Vui lòng chọn ảnh danh mục");
        return;
      }
      let hasInvalid = false;
      data.attributeConfigs?.forEach((at, i) => {
        const isSelect = at.dataType === "SELECT" || at.dataType === "MULTI_SELECT";
        if (!isSelect) return;

        const picked = (at.optionsValue ?? []).filter((x) => x.selected).length;
        if (picked === 0) {
          hasInvalid = true;
          setError(`attributeConfigs.${i}.optionsValue` as any, {
            type: "validate",
            message: "Chọn ít nhất 1 option",
          });
        }
      });

      if (hasInvalid) {
        toast.error("Vui lòng chọn option cho các thuộc tính bắt buộc");
        return; // ✅ chặn submit
      }
      const fd = new FormData();

      const payload: CategoryCreateForm = {
        name: data.name.trim(),
        slug: data.slug,
        active: data.active,
        icon: data.icon,
        parentId: data.parentId,
        attributeConfigs: data.attributeConfigs.map(at => ({
          id: at.id,
          code: at.code,
          isRequired: at.isRequired,
          isFilterable: at.isFilterable,
          displayOrder: at.displayOrder,
          allowedOptionIds: at.optionsValue.filter(ot => ot.selected).map(ot => ot.id)
        }))
      }
      console.log(payload);

      fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }))
      // ✅ MultipartFile
      fd.append("image", data.imageFile);

      const res = await createCategory(fd).unwrap();
      toast.success(res?.message ?? "Tạo danh mục thành công");

      setTimeout(() => navigate("/categories", { replace: true }), 1200);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Có lỗi xảy ra");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 0 }
    })
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    // 1) cập nhật thứ tự mảng trong RHF
    move(oldIndex, newIndex);

    // 2) nếu muốn displayOrder luôn khớp với vị trí:
    //    Lưu ý: move là async theo render, nên lấy values "hiện tại"
    //    cách an toàn: tự arrayMove dựa trên getValues rồi setValue
    const current = getValues("attributeConfigs");
    const next = arrayMove(current, oldIndex, newIndex).map((it, idx) => ({
      ...it,
      displayOrder: idx + 1, // hoặc idx nếu bạn muốn 0-based
    }));
    setValue("attributeConfigs", next, { shouldDirty: true });
  };
  const [getParentCategory, { data: dataConfig, isLoading: isLoadingConfig }] = useLazyGetCategoryByIdQuery();
  const [showModalAttribute, setShowModalAttribute] = useState(false)
  const closeModalAttribute = () => setShowModalAttribute(false)
  const handleDataConfig = () => {

    setValue("attributeConfigs", dataConfig?.attributeConfigs ?? [], { shouldDirty: true })
    closeModalAttribute()

  }
  return (
    <div className="border-app--rounded bg-white m-4 py-4 position-relative">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between border-bottom px-4 pb-4">
        <div>
          <div className="fw-bold fs-6">Tạo danh mục mới</div>
          <div className="f-caption">Cấu hình danh mục sản phẩm.</div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button
            className="btn-app btn-app--ghost btn-app--sm"
            onClick={() => navigate(-1)}
            disabled={isCreating}
            type="button"
          >
            Hủy
          </button>

          <button
            type="submit"
            form="category-form"
            className="btn-app btn-app--sm d-flex align-items-center gap-2"
            disabled={isCreating}
          >
            <RiSaveLine />
            {isCreating ? "Đang lưu..." : "Lưu danh mục"}
          </button>
        </div>
      </div>

      {/* ✅ Form */}
      <FormProvider {...methods}>
        <form id="category-form" className="form-app pt-4" onSubmit={handleSubmit(onSubmit)}>
          {/* ✅ Disable all fields while creating */}
          <fieldset disabled={isCreating}>
            <Tabs forceRenderTabPanel>
              <TabList className="px-4 tablist">
                <Tab>
                  <div><RxDashboard /> <span>Thông tin chung</span></div>
                </Tab>
                <Tab>
                  <div><CiSettings /> <span>Các thuộc tính</span></div>
                </Tab>
              </TabList>
              <TabPanel>
                <div className="px-4">
                  <div className="row gx-5 gy-4">
                    {/* name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Tên danh mục: <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control form-control-sm"
                        placeholder="Ví dụ: Điện thoại"
                        {...register("name", { required: "Tên không được để trống." })}
                      />
                      {errors.name && <span className="form-message-error">{errors.name.message}</span>}
                    </div>

                    {/* menuLabel */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Slug: <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control form-control-sm"
                        placeholder="Ví dụ: Sản phẩm"
                        {...register("slug", {
                          required: "Nhãn menu không được để trống.",
                          onChange: () => {
                            setSlugAuto(false);
                          }
                        })}
                      />
                      {errors.slug && (
                        <span className="form-message-error">{errors.slug.message}</span>
                      )}
                    </div>

                    {/* parentId */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">Danh mục cha</label>
                      <Controller
                        name="parentId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            placeholder="Chọn danh mục cha (level 1–2)"
                            options={parentOptions.filter(op => op.value != field.value)}
                            value={parentOptions.find((o) => o.value === field.value) ?? null}
                            onChange={async (opt) => {
                              const parentId = (opt as any)?.value ?? "";
                              field.onChange(parentId);
                              if (!parentId) {
                                setShowModalAttribute(false);
                                return;
                              }

                              try {
                                await getParentCategory(parentId).unwrap();
                                setShowModalAttribute(true);
                              } catch (e: any) {
                                toast.error(e?.data?.message ?? "Không lấy được thông tin danh mục cha");
                              }
                            }}
                            isClearable
                            isLoading={isParentLoading || isParentFetching}
                            isDisabled={isCreating}
                            components={{ Control, DropdownIndicator: null, IndicatorSeparator: null }}
                            styles={selectStyles}
                          />
                        )}
                      />
                    </div>

                    {/* iconUrl */}
                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Biểu tượng: <span className="text-danger">*</span>
                      </label>

                      <Controller
                        name="icon"
                        control={control}
                        rules={{ required: "Biểu tượng không được để trống" }}
                        render={({ field }) => (

                          <Select<IconOption, false>
                            value={optionIcons.find((o) => o.value === field.value) ?? null}
                            onChange={(opt) => field.onChange(opt?.value ?? "")}
                            options={optionIcons.filter((o) => o.value !== field.value)}
                            isSearchable
                            isClearable
                            isDisabled={isCreating}
                            placeholder="Chọn biểu tượng"
                            components={{
                              Option: IconOptionRender,
                              SingleValue,
                              Control,
                              DropdownIndicator: null,
                              IndicatorSeparator: null,
                            }}
                            styles={{
                              ...selectStyles,
                              control: (base: any) => ({ ...base, minHeight: 34 }),
                              valueContainer: (base: any) => ({
                                ...base,
                                paddingTop: 0,
                                paddingBottom: 0,
                              }),
                              indicatorsContainer: (base: any) => ({ ...base, height: 34 }),
                            }}
                          />


                        )}
                      />
                      {errors.icon && (
                        <span className="form-message-error">{errors.icon.message}</span>
                      )}
                    </div>

                    <div className="col-6 d-flex flex-column gap-3">
                      <div>
                        <Controller
                          name="imageFile"
                          control={control}
                          rules={{
                            required: "Vui lòng chọn ảnh",
                            validate: (file) => {
                              if (!file) return true;
                              if (file.size > 5 * 1024 * 1024) return "Tối đa 5MB";
                              const okTypes = ["image/jpeg", "image/png", "image/webp"];
                              if (!okTypes.includes(file.type)) return "Chỉ hỗ trợ JPG/PNG/WEBP";
                              return true;
                            },
                          }}
                          render={({ field, fieldState }) => (
                            <UploadImageBox
                              value={field.value}
                              onChange={field.onChange}
                              error={fieldState.error?.message}
                              width='64px'
                              height='64px'
                              picker={false}
                              message=''
                              Icon={<FiUpload size={22} />}
                            />
                          )}
                        />
                      </div>
                      {/* isVisible */}
                      <div className="">
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
                        {errors.active && (
                          <span className="form-message-error">{errors.active.message}</span>
                        )}
                      </div>


                    </div>
                  </div>
                  <div className="my-4 border-top" />
                </div>
              </TabPanel>
              <TabPanel>
                <div className="px-4">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <div className="f-section d-flex align-items-center gap-2">
                        <div className="fs-4">
                          <CiSettings />
                        </div>
                        <span>Cấu hình thuộc tính</span>
                      </div>
                      <span className="f-caption">Chọn thuộc tính và giới hạn các tùy chọn hợp lệ cho danh mục này.</span>
                    </div>
                    <div style={{ minWidth: 200 }}>
                      <Select<AttributeConfigUI>
                        options={options}
                        placeholder="Tìm kiếm thuộc tính"
                        isClearable
                        value={selected}
                        isSearchable
                        onInputChange={(v) => setSearch(v)}
                        filterOption={null}
                        onChange={onSelect}
                        noOptionsMessage={() =>
                          search ? "Không tìm thấy" : "Nhấp để tìm"
                        }
                        isLoading={isAttributeLoading}
                        components={{
                          Control,
                          DropdownIndicator: null
                        }}
                        styles={selectStyles}
                      />
                    </div>
                  </div>
                  {fields && fields.length > 0 ? (
                    <div className="mt-5">
                      <DndContext
                        sensors={sensors}
                        onDragEnd={onDragEnd}
                      >
                        <SortableContext
                          items={fields.map((f) => f.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {fields.map((f, index) => (
                            <SortableAttributeItem
                              key={f.rhfKey}
                              index={index}
                              itemId={f.id}
                              onDelete={() => remove(index)}
                            />
                          ))}

                        </SortableContext>
                      </DndContext>
                    </div>
                  )
                    : (
                      <div className="rounded d-flex align-items-center justify-content-center bg-muted mt-5" style={{ height: 150 }}>
                        <span className="f-hint">Chưa có thuộc tính nào được cấu hình.</span>
                      </div>
                    )}
                </div>
              </TabPanel>
            </Tabs>
          </fieldset>
        </form>
      </FormProvider>
      <Modal
        show={showModalAttribute}
        onHide={closeModalAttribute}
        centered
        dialogClassName="modal-app"
        backdropClassName="modal-app-backdrop"
      >
        <Modal.Header>
          <Modal.Title>
            <span className="fw-bold fs-5">Xác nhận cấu hình danh mục</span>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div className="mb-2">Danh mục cha có sẵn cấu hình. Bạn có muốn áp dụng không?</div>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            className="btn-app btn-app--sm btn-app--ghost p-3"
            onClick={closeModalAttribute}
            disabled={isLoadingConfig}
          >
            Huỷ
          </button>
          <button
            type="button"
            className="btn-app btn-app--sm"
            onClick={handleDataConfig}
            disabled={isLoadingConfig}
          >
            Đồng ý
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CategoryCreate;
