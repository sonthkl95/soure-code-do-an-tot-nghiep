import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Select, { components } from "react-select";
import { Controller, FormProvider, useFieldArray, useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { toast } from "react-toastify";
import { RiSaveLine } from "react-icons/ri";

import { optionIcons } from "../../features/data/icon.data";
import type { IconOption } from "../../features/data/icon.data";
import { Control, SingleValue } from "../../configs/select.config";
import { selectStyles } from "../../features/data/select.data";

import type { AttributeConfigUI, CategoryDetail, CategoryEditFormUI, CategoryOption, CategoryUpdateForm } from "../../types/category.type";

import {
  useGetCategoryByIdQuery,
  useGetCategoryOptionQuery,
  useLazyGetCategoryByIdQuery,
  useUpdateCategoryMutation,
} from "../../features/category/category.api";

import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
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
import { PiEyeSlashThin, PiEyeThin } from "react-icons/pi";
import { slugify } from "../../utils/string";

type ParentSelectOption = { value: string; label: string };

const CategoryEdit = () => {
  const idemKey = useMemo(() => crypto.randomUUID(), [])

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const methods = useForm<CategoryEditFormUI>({
    defaultValues: {
      name: "",
      slug: "",
      parentId: "",
      active: true,
      icon: "",
      imageFile: null, // chỉ dùng khi chọn ảnh mới
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
    getValues,
    reset,
    watch,
    formState: { errors },
  } = methods;

  const { fields, move, remove, append } = useFieldArray({
    control,
    name: "attributeConfigs",
    keyName: "rhfKey",
  });

  // ===== Load detail =====
  const { data: detail, isLoading: isDetailLoading, isFetching: isDetailFetching } = useGetCategoryByIdQuery(
    id ?? "",
    { skip: !id }
  );
  console.log({ detail });

  // ===== Parent options =====
  const { data: parentData, isLoading: isParentLoading, isFetching: isParentFetching } = useGetCategoryOptionQuery(
    null
  );

  const parentOptions = useMemo<ParentSelectOption[]>(() => {
    const arr = (parentData ?? []) as CategoryOption[];
    return arr.map((x) => ({
      value: x.id,
      label: `${x.name} (Lv ${x.level})`,
    }));
  }, [parentData]);

  // icon option render
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

  // ===== image preview (hiện ảnh hiện tại) =====
  const [serverImageUrl, setServerImageUrl] = useState<string>("");
  const [slugAuto, setSlugAuto] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  // ===== fill form from API =====
  useEffect(() => {
    if (!detail) return;
    const d = detail as CategoryDetail;

    const imageUrl = d.image.imageUrl ?? "";
    setServerImageUrl(imageUrl);


    reset(
      {
        id: d.id,
        name: d.name ?? "",
        slug: d.slug ?? "",
        parentId: d.parentId ?? "",
        active: d.active ?? true,
        icon: d.icon ?? "",
        imageFile: null,
        attributeConfigs:
          (d.attributeConfigs ?? []).map((at, idx: number) => ({
            id: at.id,
            isRequired: !!at.isRequired,
            isFilterable: !!at.isFilterable,
            displayOrder: at.displayOrder ?? idx + 1,
            label: at.label,
            code: at.code,
            dataType: at.dataType,
            unit: at.unit,
            // map options
            optionsValue: (at.optionsValue ?? at.options ?? []).map((op: any) => ({
              id: op.id,
              value: op.value,
              label: op.label,
              active: !!op.active,
              deprecated: !!op.deprecated,
              selected: !!op.selected
            })),
          })) ?? [],
      },
      { keepDirty: false, keepTouched: false }
    );
    const autoSlug = slugify(d.name ?? "") === (d.slug ?? "");
    setSlugAuto(autoSlug);

    setHydrated(true);
  }, [detail, reset]);

  // ===== attribute search (giống create) =====
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [options, setOptions] = useState<AttributeConfigUI[]>([]);
  const [selected, setSelected] = useState<AttributeConfigUI | null>(null);
  const [searchAttributeOptions, { isLoading: isAttributeLoading }] = useGetAttributeOptionsMutation();

  useEffect(() => {
    if (!debouncedSearch.trim()) return;

    const run = async () => {
      const res = await searchAttributeOptions({
        keyword: debouncedSearch,
        attributeIds: fields ? fields.map((sl) => sl.id) : [],
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
          optionsValue: x.options.map((op) => ({ id: op.id, value: op.value, label: op.label, active: op.active, deprecated: op.deprecated })),
        }))
      );
    };

    run();
  }, [debouncedSearch, fields, searchAttributeOptions]);

  const onSelect = (opt: AttributeConfigUI | null) => {
    setSelected(null);
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
  const name = watch("name");
  const slug = watch("slug");
  // ===== DnD (giống create) =====
  useEffect(() => {
    if (!hydrated) return;     // ⭐ chặn lần đầu load
    if (!slugAuto) return;

    const next = slugify(name || "");
    if (next === slug) return;

    setValue("slug", next, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [name, slug, slugAuto, hydrated, setValue]);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 0 },
    })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    move(oldIndex, newIndex);

    const current = getValues("attributeConfigs");
    const next = arrayMove(current, oldIndex, newIndex).map((it, idx) => ({
      ...it,
      displayOrder: idx + 1,
    }));
    setValue("attributeConfigs", next, { shouldDirty: true });
  };

  // ===== parent config modal (giống create) =====
  const [getParentCategory, { data: dataConfig, isLoading: isLoadingConfig }] = useLazyGetCategoryByIdQuery();
  const [showModalAttribute, setShowModalAttribute] = useState(false);
  const closeModalAttribute = () => setShowModalAttribute(false);

  const handleDataConfig = () => {
    setValue("attributeConfigs", dataConfig?.attributeConfigs ?? [], { shouldDirty: true });
    closeModalAttribute();
  };

  // ===== update submit =====
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  const onSubmit: SubmitHandler<CategoryEditFormUI> = async (data) => {
    try {
      if (!id) {
        toast.error("Thiếu id danh mục");
        return;
      }

      // validate options select types
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
        return;
      }
      console.log(data.imageFile);
      console.log({
        id: data.id,
        name: data.name.trim(),
        slug: data.slug,
        active: data.active,
        icon: data.icon,
        parentId: data.parentId,
        attributeConfigs: data.attributeConfigs.map((at) => ({
          id: at.id,
          isRequired: at.isRequired,
          isFilterable: at.isFilterable,
          displayOrder: at.displayOrder,
          allowedOptionIds: (at.optionsValue ?? []).filter((ot) => ot.selected).map((ot) => ot.value),
        })),
      });

      const payload: CategoryUpdateForm = {
        id: data.id,
        name: data.name.trim(),
        slug: data.slug,
        active: data.active,
        icon: data.icon,
        parentId: data.parentId,
        attributeConfigs: data.attributeConfigs.map((at) => ({
          id: at.id,
          code: at.code,
          isRequired: at.isRequired,
          isFilterable: at.isFilterable,
          displayOrder: at.displayOrder,
          allowedOptionIds: (at.optionsValue ?? []).filter((ot) => ot.selected).map((ot) => ot.id),
        })),
      };
      console.log(payload);

      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify(payload)], { type: "application/json" }));

      // chỉ gửi image nếu có chọn mới
      if (data.imageFile) {
        fd.append("image", data.imageFile);
      }

      const res = await updateCategory({ id, idemKey: idemKey, body: fd } as any).unwrap();
      toast.success(res?.message ?? "Cập nhật danh mục thành công");
      setTimeout(() => navigate("/categories", { replace: true }), 1200);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Có lỗi xảy ra");
    }
  };

  const isBusy = isDetailLoading || isDetailFetching || isUpdating;
  // const attributeOptionWatch = useWatch({name: "attributeConfigs", control})
  const sortedFields = [...fields].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
  );
  console.log({ sortedFields });
  const active = watch("active")
  return (
    <div className="border-app--rounded bg-white m-4 py-4 position-relative">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between border-bottom px-4 pb-4">
        <div>
          <div className="fw-bold fs-6">Cập nhật danh mục</div>
          <div className="f-caption">Chỉnh sửa cấu hình danh mục sản phẩm.</div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button className="btn-app btn-app--ghost btn-app--sm" onClick={() => navigate(-1)} disabled={isBusy}>
            Hủy
          </button>

          <button
            type="submit"
            form="category-edit-form"
            className="btn-app btn-app--sm d-flex align-items-center gap-2"
            disabled={isBusy}
          >
            <RiSaveLine />
            {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      <FormProvider {...methods}>
        <form id="category-edit-form" className="form-app pt-4" onSubmit={handleSubmit(onSubmit)}>
          <fieldset disabled={isBusy}>
            <Tabs forceRenderTabPanel>
              <TabList className="px-4 tablist">
                <Tab>
                  <div>
                    <RxDashboard /> <span>Thông tin chung</span>
                  </div>
                </Tab>
                <Tab>
                  <div>
                    <CiSettings /> <span>Các thuộc tính</span>
                  </div>
                </Tab>
              </TabList>

              <TabPanel>
                <div className="px-4">
                  <div className="row gx-5 gy-4">
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

                    <div className="col-12 col-md-6">
                      <label className="form-label">
                        Slug: <span className="text-danger">*</span>
                      </label>
                      <input
                        className="form-control form-control-sm"
                        placeholder="Ví dụ: dien-thoai"
                        {...register("slug", {
                          required: "Slug không được để trống.",
                          onChange: () => setSlugAuto(false),
                        })}
                      />
                      {errors.slug && <span className="form-message-error">{errors.slug.message}</span>}
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Danh mục cha</label>
                      <Controller
                        name="parentId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            placeholder="Chọn danh mục cha (level 1–2)"
                            // tránh chọn chính nó làm cha
                            options={parentOptions.filter((op) => op.value !== (id ?? "") && op.value !== field.value)}
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
                            isDisabled={isBusy}
                            components={{ Control, DropdownIndicator: null, IndicatorSeparator: null }}
                            styles={selectStyles}
                          />
                        )}
                      />
                    </div>

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
                            isDisabled={isBusy}
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
                              valueContainer: (base: any) => ({ ...base, paddingTop: 0, paddingBottom: 0 }),
                              indicatorsContainer: (base: any) => ({ ...base, height: 34 }),
                            }}
                          />
                        )}
                      />
                      {errors.icon && <span className="form-message-error">{errors.icon.message}</span>}
                    </div>

                    <div className="col-6 d-flex flex-column gap-3">
                      {/* Ảnh hiện tại */}
                      <div>
                        <label className="form-label">Ảnh hiện tại</label>
                        {serverImageUrl ? (
                          <div className="mb-2">
                            <img
                              src={serverImageUrl}
                              alt="category"
                              style={{
                                width: 140,
                                height: 140,
                                objectFit: "cover",
                                borderRadius: 8,
                                border: "1px solid var(--app-border)",
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-muted">Không có ảnh</div>
                        )}
                      </div>

                      {/* Chọn ảnh mới */}
                      <div>
                        <Controller
                          name="imageFile"
                          control={control}
                          rules={{
                            validate: (file) => {
                              if (!file) return true; // edit: không bắt buộc
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

                      <div>
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
                        {errors.active && <span className="form-message-error">{errors.active.message}</span>}
                      </div>
                    </div>
                  </div>

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
                        noOptionsMessage={() => (search ? "Không tìm thấy" : "Nhấp để tìm")}
                        isLoading={isAttributeLoading}
                        components={{ Control, DropdownIndicator: null }}
                        styles={selectStyles}
                      />
                    </div>
                  </div>

                  {fields && fields.length > 0 ? (
                    <div className="mt-5">
                      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
                        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                          {sortedFields.map((f, index) => (
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
                  ) : (
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

      {/* Modal apply parent config */}
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
          <button type="button" className="btn-app btn-app--sm btn-app--ghost p-3" onClick={closeModalAttribute} disabled={isLoadingConfig}>
            Huỷ
          </button>
          <button type="button" className="btn-app btn-app--sm" onClick={handleDataConfig} disabled={isLoadingConfig}>
            Đồng ý
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CategoryEdit;
