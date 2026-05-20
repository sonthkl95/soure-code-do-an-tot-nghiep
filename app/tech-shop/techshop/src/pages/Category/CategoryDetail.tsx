import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import Select, { components } from "react-select";
import { Controller, FormProvider, useFieldArray, useForm } from "react-hook-form";
import { RxDashboard } from "react-icons/rx";
import { CiSettings } from "react-icons/ci";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";

import { optionIcons } from "../../features/data/icon.data";
import type { IconOption } from "../../features/data/icon.data";
import { Control, SingleValue } from "../../configs/select.config";
import { selectStyles } from "../../features/data/select.data";

import type { CategoryOption, CategoryDetail } from "../../types/category.type";
import type { CategoryCreateFormUI } from "../../types/category.type";

import { useGetCategoryByIdQuery, useGetCategoryOptionQuery } from "../../features/category/category.api";
import { PiEyeSlashThin, PiEyeThin } from "react-icons/pi";

type ParentSelectOption = { value: string; label: string };

const CategoryDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

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

  const { register, control, reset, getValues, setValue, watch } = methods;

  // chỉ để render list attributeConfigs từ RHF cho tiện
  const { fields } = useFieldArray({
    control,
    name: "attributeConfigs",
    keyName: "rhfKey",
  });

  // ===== Load detail =====
  const { data: detail, isLoading: isDetailLoading, isFetching: isDetailFetching } = useGetCategoryByIdQuery(
    id ?? "",
    { skip: !id }
  );

  // ===== Parent options =====
  const { data: parentData, isLoading: isParentLoading, isFetching: isParentFetching } =
    useGetCategoryOptionQuery(null);

  const parentOptions = useMemo<ParentSelectOption[]>(() => {
    const arr = (parentData ?? []) as CategoryOption[];
    return arr.map((x) => ({
      value: x.id,
      label: `${x.name} (Lv ${x.level})`,
    }));
  }, [parentData]);

  const BOOL_OPTIONS = useMemo(
    () => [
      { value: true, label: "Có" },
      { value: false, label: "Không" },
    ],
    []
  );

  // Icon option render
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

  // ===== Fill form from API =====
  const [serverImageUrl, setServerImageUrl] = useState<string>("");

  useEffect(() => {
    if (!detail) return;
    const d = detail as CategoryDetail;
    console.log({ d });

    const imageUrl = d.image.imageUrl ?? "";
    setServerImageUrl(imageUrl);

    reset(
      {
        name: d.name ?? "",
        slug: d.slug ?? "",
        parentId: d.parentId ?? "",
        active: d.active ?? true,
        icon: d.icon ?? "",
        imageFile: null,
        attributeConfigs:
          (d.attributeConfigs ?? []).map((at: any, idx: number) => ({
            id: at.id,
            isRequired: !!at.isRequired,
            isFilterable: !!at.isFilterable,
            displayOrder: at.displayOrder ?? idx + 1,
            label: at.label,
            code: at.code,
            dataType: at.dataType,
            unit: at.unit,
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
      { keepDirty: false }
    );

    // nếu backend trả allowedOptionIds thì bật active theo allowedOptionIds
    const allowedByAttr: Record<string, string[]> = {};
    (d.attributeConfigs ?? []).forEach((at: any) => {
      allowedByAttr[at.id] = (at.allowedOptionIds ?? []) as string[];
    });

    if (Object.keys(allowedByAttr).length > 0) {
      const current = getValues("attributeConfigs");
      const next = current.map((at) => ({
        ...at,
        optionsValue: (at.optionsValue ?? []).map((op) => ({
          ...op,
          active: (allowedByAttr[at.id] ?? []).includes(op.value),
        })),
      }));
      setValue("attributeConfigs", next, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, reset]);

  const isBusy = isDetailLoading || isDetailFetching;
  const active = watch("active")
  return (
    <div className="border-app--rounded bg-white m-4 py-4 position-relative">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between border-bottom px-4 pb-4">
        <div>
          <div className="fw-bold fs-6">Chi tiết danh mục</div>
          <div className="f-caption">Xem thông tin và cấu hình danh mục sản phẩm.</div>
        </div>

        <div className="d-flex align-items-center gap-3">
          <button className="btn-app btn-app--ghost btn-app--sm" onClick={() => navigate(-1)} disabled={isBusy}>
            Quay lại
          </button>
        </div>
      </div>

      <FormProvider {...methods}>
        {/* Không cần submit */}
        <form className="form-app pt-4">
          {/* ✅ Disable hết đúng nghĩa detail */}
          <fieldset disabled>
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

              {/* TAB 1 */}
              <TabPanel>
                <div className="px-4">
                  <div className="row gx-5 gy-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Tên danh mục</label>
                      <input className="form-control form-control-sm" {...register("name")} readOnly />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Slug</label>
                      <input className="form-control form-control-sm" {...register("slug")} readOnly />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label">Danh mục cha</label>
                      <Controller
                        name="parentId"
                        control={control}
                        render={({ field }) => (
                          <Select
                            placeholder="Danh mục gốc"
                            options={parentOptions}
                            value={parentOptions.find((o) => o.value === field.value) ?? null}
                            onChange={() => { }}
                            isClearable={false}
                            isLoading={isParentLoading || isParentFetching}
                            isDisabled
                            components={{ Control, DropdownIndicator: null, IndicatorSeparator: null }}
                            styles={selectStyles}
                          />
                        )}
                      />
                    </div>

                    <div className="col-6">
                      <label className="form-label">Biểu tượng</label>
                      <Controller
                        name="icon"
                        control={control}
                        render={({ field }) => (
                          <Select<IconOption, false>
                            value={optionIcons.find((o) => o.value === field.value) ?? null}
                            onChange={() => { }}
                            options={optionIcons}
                            isSearchable
                            isClearable={false}
                            isDisabled
                            placeholder="—"
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
                    </div>

                    <div className="col-6 d-flex flex-column gap-3">
                      {/* Ảnh: chỉ hiển thị */}
                      <div>
                        <label className="form-label">Ảnh danh mục</label>
                        {serverImageUrl ? (
                          <div>
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

                      <div>
                        <button disabled className={`d-flex align-items-center gap-2 btn-app ${active ? "btn-app--active" : "btn-app--destructive"}`} type="button">
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
                  </div>

                </div>
              </TabPanel>

              {/* TAB 2 */}
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
                      <span className="f-caption">Danh sách thuộc tính đã cấu hình cho danh mục này.</span>
                    </div>
                  </div>

                  {fields && fields.length > 0 ? (
                    <div className="mt-4 d-flex flex-column gap-3">
                      {fields
                        .slice()
                        .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
                        .map((f: any) => {
                          const isSelect = f.dataType === "SELECT" || f.dataType === "MULTI_SELECT";
                          const picked = (f.optionsValue ?? []).filter((x: any) => x.selected);

                          return (
                            <div key={f.rhfKey} className="border rounded p-3">
                              <div className="d-flex align-items-start justify-content-between">
                                <div>
                                  <div className="fw-semibold">
                                    {f.label}{" "}
                                    <span className="text-muted fw-normal" style={{ fontSize: 12 }}>
                                      ({f.code} • {f.dataType}
                                      {f.unit ? ` • ${f.unit}` : ""})
                                    </span>
                                  </div>
                                  <div className="text-muted" style={{ fontSize: 12 }}>
                                    Thứ tự: {f.displayOrder} • Bắt buộc: {f.isRequired ? "Có" : "Không"} • Lọc:{" "}
                                    {f.isFilterable ? "Có" : "Không"}
                                  </div>
                                </div>
                              </div>

                              {isSelect ? (
                                <div className="mt-3">
                                  <div className="fw-semibold mb-2">Options hợp lệ</div>
                                  {picked.length === 0 ? (
                                    <div className="text-muted">Không có option nào được chọn.</div>
                                  ) : (
                                    <div className="d-flex flex-wrap gap-2">
                                      {picked.map((op: any) => (
                                        <span key={op.value} className="badge bg-secondary">
                                          {op.label}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div
                      className="rounded d-flex align-items-center justify-content-center bg-muted mt-5"
                      style={{ height: 150 }}
                    >
                      <span className="f-hint">Chưa có thuộc tính nào được cấu hình.</span>
                    </div>
                  )}
                </div>
              </TabPanel>
            </Tabs>
          </fieldset>
        </form>
      </FormProvider>
    </div>
  );
};

export default CategoryDetail;
