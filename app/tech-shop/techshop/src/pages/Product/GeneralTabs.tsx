

import { selectStyles } from '../../features/data/select.data'
import Select from "react-select";
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import type { DataType, ProductFormUI } from '../../types/product.type';
import UploadImageBox from '../../components/common/UploadImageBox';
import { PiImageSquareLight } from 'react-icons/pi';
import { IoAdd } from 'react-icons/io5';
import { useGetBrandOptionQuery } from '../../features/brand/brand.api';
import type { Option } from '../../types/select.type';
import { useGetLeafCategoryQuery, useLazyGetCategoryByIdQuery } from '../../features/category/category.api';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import { slugify } from '../../utils/string';

const GeneralTabs = ({ updating }: { updating: boolean }) => {
    const { register, control, watch, setValue, formState: { errors }, getValues } = useFormContext<ProductFormUI>();
    const { data: dataBrand, isLoading: isBrandLoading } = useGetBrandOptionQuery(null);
    const { data: dataCategory, isLoading: isCategoryLoading } = useGetLeafCategoryQuery(null);
    const [getCategoryDetail, { isLoading: isAttributeLoading }] = useLazyGetCategoryByIdQuery();
    const hasVariants = useWatch({ name: "hasVariants", control })
    const [slugAuto, setSlugAuto] = useState(true);

    const category = useWatch({ name: "category", control })
    const onlyNumberNoLeadingZero = (value: string) => {
        // 1. Xóa mọi ký tự không phải số
        let v = value.replace(/\D+/g, '');

        // 2. Xóa số 0 ở đầu (nhưng giữ lại "0" nếu chỉ có 0)
        v = v.replace(/^0+(?=\d)/, '');

        return v;
    };
    const name = watch("name")
    const slug = watch("slug")
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
    const allowOnlyNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = [
            "Backspace", "Delete", "Tab", "Enter", "Escape",
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            "Home", "End"
        ];

        // Cho phép Ctrl/Cmd shortcuts: copy/paste/cut/select all
        if (e.ctrlKey || e.metaKey) return;

        if (allowedKeys.includes(e.key)) return;

        // Cho phép số
        if (/^\d$/.test(e.key)) return;

        // Còn lại chặn
        e.preventDefault();
    };
    const allowNumberAndDotNoLeadingDotKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        const allowedKeys = [
            "Backspace", "Delete", "Tab", "Enter", "Escape",
            "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
            "Home", "End"
        ];

        if (e.ctrlKey || e.metaKey) return;
        if (allowedKeys.includes(e.key)) return;

        const input = e.currentTarget;

        // Cho phép số
        if (/^\d$/.test(e.key)) return;

        // Cho phép dấu . nhưng:
        if (e.key === ".") {
            // không cho "." ở đầu (kể cả đang chọn toàn bộ)
            const isStart = (input.selectionStart ?? 0) === 0;
            const willBeEmpty = input.value.length === 0 || input.value === input.value.slice(input.selectionStart ?? 0, input.selectionEnd ?? 0);
            if (isStart && willBeEmpty) {
                e.preventDefault();
                return;
            }

            // không cho nhiều dấu .
            if (input.value.includes(".")) {
                e.preventDefault();
                return;
            }
            return;
        }

        e.preventDefault();
    };
    const normalizeNumberDotOnChange = (raw: string) => {
        // 1) chỉ giữ số và .
        let v = raw.replace(/[^0-9.]/g, "");

        // 2) chỉ cho 1 dấu .
        const firstDot = v.indexOf(".");
        if (firstDot !== -1) {
            v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
        }

        // 3) không cho "." ở đầu -> đổi ".5" thành "0.5"
        if (v.startsWith(".")) v = "0" + v;

        // 4) xóa 0 ở đầu phần nguyên (nhưng giữ "0.xxx")
        const [intPart, decPart] = v.split(".");
        let intNorm = intPart.replace(/^0+(?=\d)/, ""); // 00012 -> 12

        // nếu int rỗng (trường hợp "000" -> ""), cho về "0"
        if (intNorm === "") intNorm = "0";

        return decPart !== undefined ? `${intNorm}.${decPart}` : intNorm;
    };
    const toDataType = (x: unknown): DataType => {
        switch (x) {
            case "TEXT":
            case "NUMBER":
            case "DATE":
            case "BOOLEAN":
            case "SELECT":
            case "MULTI_SELECT":
                return x;
            default:
                return "TEXT"; // fallback an toàn (hoặc throw nếu bạn muốn strict)
        }
    };

    return (
        <div className="px-4">
            <div className="row">
                <div className="col-8">
                    <div className="f-section">Thông tin cơ bản</div>
                    <div className="row mt-3 gy-2">
                        <div className="col-12">
                            <label className="form-label">
                                Tên sản phẩm: <span className="text-danger">*</span>
                            </label>
                            <input
                                className="form-control form-control-sm"
                                placeholder="Ví dụ: Iphone 15 Pro Max"
                                {...register("name", { required: "Tên sản phẩm không được để trống." })}
                            />
                            {errors.name && <span className="form-message-error">{errors.name.message}</span>}
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label">
                                Slug: <span className="text-danger">*</span>
                            </label>
                            <input
                                className="form-control form-control-sm"
                                placeholder="Ví dụ: iphone-15-promax"
                                {...register("slug", { required: "Slug không được để trống." })}
                                onChange={() => setSlugAuto(false)}
                            />
                            {errors.slug && (
                                <span className="form-message-error">{errors.slug.message}</span>
                            )}
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label">Thương hiệu: <span className="text-danger">*</span></label>
                            <Controller
                                name="brandId"
                                control={control}
                                rules={{
                                    required: {
                                        value: true,
                                        message: "Thương hiệu không được để trống."
                                    }
                                }}
                                render={({ field }) => (
                                    <Select<Option>
                                        placeholder="Chọn thương hiệu"
                                        options={dataBrand?.map(item => ({ value: item.id, label: item.name })).filter(item => item.value != field.value)}
                                        value={dataBrand?.map(item => ({ value: item.id, label: item.name })).find((o) => o.value === field.value) ?? null}
                                        onChange={(opt) => field.onChange(opt?.value)}
                                        isSearchable
                                        isClearable
                                        isLoading={isBrandLoading}
                                        isDisabled={isBrandLoading || updating}
                                        styles={selectStyles}
                                    />
                                )}
                            />
                            {errors.brandId && (
                                <span className="form-message-error">{errors.brandId.message}</span>
                            )}
                        </div>
                        <div className="col-6">
                            <label className="form-label">Danh mục: <span className="text-danger">*</span></label>
                            <Controller
                                name="category.id"
                                control={control}
                                rules={{
                                    required: {
                                        value: true,
                                        message: "Danh mục không được để trống."
                                    }
                                }}
                                render={({ field }) => (
                                    <Select<Option>
                                        placeholder="Chọn danh mục"
                                        options={dataCategory?.map(item => ({ value: item.id, label: item.name })).filter(op => op.value != field.value)}
                                        value={dataCategory?.map(item => ({ value: item.id, label: item.name })).find((o) => o.value === field.value) ?? null}
                                        onChange={async (opt) => {
                                            const categoryId = (opt as any)?.value ?? "";
                                            field.onChange(categoryId);
                                            if (!categoryId) {
                                                return;
                                            }
                                            try {
                                                const res = await getCategoryDetail(categoryId);
                                                const { data } = res;
                                                setValue("category", {
                                                    id: data?.id ?? "",
                                                    name: data?.name ?? "",
                                                    slug: data?.slug ?? ""
                                                })
                                                setValue("attributeOptions", (data?.attributeConfigs ?? []).map(item => {
                                                    const dt = toDataType(item.dataType);
                                                    return {
                                                        id: item.id,
                                                        code: item.code,
                                                        label: item.label,
                                                        isRequired: item.isRequired,
                                                        isFilterable: item.isFilterable,
                                                        displayOrder: item.displayOrder,
                                                        unit: item.unit,
                                                        dataType: dt,
                                                        options: (item.optionsValue ?? [])
                                                            .filter((ot) => ot.active)
                                                            .map((ot) => ({ id: ot.id, value: ot.id, label: ot.label })),
                                                    };
                                                }));
                                                setValue("attributes", (data?.attributeConfigs ?? []).map((item) => {
                                                    const dt = toDataType(item.dataType);
                                                    return {
                                                        id: item.id,
                                                        code: item.code,
                                                        dataType: dt,
                                                        label: item.label,
                                                        displayOrder: item.displayOrder ?? 0,
                                                        unit: item.unit ?? "",
                                                        value: "",
                                                    }
                                                }))
                                            } catch (error: any) {
                                                toast.error(error?.data?.message ?? "Không lấy được thông tin danh mục");
                                            }
                                        }}
                                        isSearchable
                                        isLoading={isCategoryLoading}
                                        isDisabled={isCategoryLoading || isAttributeLoading || updating}
                                        styles={selectStyles}
                                    />
                                )}
                            />
                            {errors.category?.id && (
                                <span className="form-message-error">{errors.category?.id.message}</span>
                            )}
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label">
                                Tháng bảo hành: <span className="text-danger">*</span>
                            </label>
                            <input
                                className="form-control form-control-sm"
                                placeholder="Ví dụ: 36"
                                {...register("warrantyMonth", { required: "Tháng bảo hành không được để trống." })}
                            />
                            {errors.warrantyMonth && (
                                <span className="form-message-error">{errors.warrantyMonth.message}</span>
                            )}
                        </div>
                        {!hasVariants && (
                            <>
                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor='costPrice'>
                                        Giá gốc: <span className="text-danger">*</span>
                                    </label>
                                    <Controller
                                        control={control}
                                        name='costPrice'
                                        rules={{
                                            required: {
                                                value: true,
                                                message: "Giá gốc không được để trống"
                                            },
                                            validate: {
                                                equalZero: (v) =>
                                                    Number(v) > 0 || "Giá trị phải lớn hơn 0"
                                            }
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    className="form-control form-control-sm"
                                                    placeholder="Ví dụ: 36"
                                                    id='costPrice'
                                                    onKeyDown={allowNumberAndDotNoLeadingDotKeyDown}
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(normalizeNumberDotOnChange(e.target.value))}
                                                />
                                                {fieldState.error && (
                                                    <span className="form-message-error">{fieldState.error.message}</span>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor='price'>
                                        Giá bán: <span className="text-danger">*</span>
                                    </label>
                                    <Controller
                                        control={control}
                                        name='price'
                                        rules={{
                                            required: {
                                                value: true,
                                                message: "Giá bán không được để trống"
                                            },
                                            validate: {
                                                equalZero: (v) =>
                                                    Number(v) > 0 || "Giá trị phải lớn hơn 0"
                                            }
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    className="form-control form-control-sm"
                                                    placeholder="Ví dụ: 36"
                                                    id='price'
                                                    onKeyDown={allowNumberAndDotNoLeadingDotKeyDown}
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(normalizeNumberDotOnChange(e.target.value))}
                                                />
                                                {fieldState.error && (
                                                    <span className="form-message-error">{fieldState.error.message}</span>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor='originalPrice'>
                                        Giá niêm yết: <span className="text-danger">*</span>
                                    </label>
                                    <Controller
                                        control={control}
                                        name='originalPrice'
                                        rules={{
                                            required: {
                                                value: true,
                                                message: "Giá niêm yết không được để trống"
                                            },
                                            validate: {
                                                equalZero: (v) =>
                                                    Number(v) > 0 || "Giá trị phải lớn hơn 0"
                                            }
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    className="form-control form-control-sm"
                                                    placeholder="Ví dụ: 36"
                                                    id='originalPrice'
                                                    onKeyDown={allowNumberAndDotNoLeadingDotKeyDown}
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(normalizeNumberDotOnChange(e.target.value))}
                                                />
                                                {fieldState.error && (
                                                    <span className="form-message-error">{fieldState.error.message}</span>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label className="form-label" htmlFor='stock'>
                                        Số lượng: <span className="text-danger">*</span>
                                    </label>
                                    <Controller
                                        control={control}
                                        name='stock'
                                        rules={{
                                            required: {
                                                value: true,
                                                message: "Tồn kho không được để trống"
                                            },
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <input
                                                    className="form-control form-control-sm"
                                                    placeholder="Ví dụ: 36"
                                                    id='stock'
                                                    value={field.value}
                                                    onKeyDown={allowOnlyNumberKeyDown}
                                                    onChange={(e) => {
                                                        const clean = onlyNumberNoLeadingZero(e.target.value)
                                                        field.onChange(clean);
                                                    }}
                                                />
                                                {fieldState.error && (
                                                    <span className="form-message-error">{fieldState.error.message}</span>
                                                )}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className='pt-2 d-flex flex-column align-items-start gap-2'>
                                    <span>Sản phẩm có nhiểu biến thể vui lòng chọn nút bên dưới</span>
                                    <button onClick={() => {
                                        if (category?.id) {
                                            setValue("hasVariants", true)
                                            setValue("bulk", {
                                                price: getValues("price") ?? 0,
                                                originalPrice: getValues("originalPrice") ?? 0,
                                                costPrice: getValues("costPrice") ?? 0,
                                                stock: getValues("stock") ?? 0
                                            })
                                            setValue("draft", {
                                                name: "",
                                                value: "",
                                            })
                                        } else {
                                            toast.error("Vui lòng chọn danh mục trước khi tạo biến thể.")
                                        }
                                    }} className='btn-app btn-app--sm' type='button'>Tạo biến thể</button>
                                </div>
                            </>
                        )}

                    </div>
                </div>
                <div className="col-4">
                    <div>
                        <div className='fw-bold'>Ảnh đại diện</div>
                        <Controller
                            control={control}
                            name="image"
                            rules={{
                                required: "Vui lòng chọn ảnh",
                                validate: (value) => {
                                    // 1. Edit mode: logo cũ (string url) → hợp lệ
                                    if (typeof value === "string") return true;

                                    // 2. Không chọn gì
                                    if (!value) return true; // hoặc false nếu create bắt buộc

                                    // 3. Validate file mới
                                    if (value.size > 5 * 1024 * 1024) {
                                        return "Tối đa 5MB";
                                    }

                                    const okTypes = ["image/jpeg", "image/png", "image/webp"];
                                    if (!okTypes.includes(value.type)) {
                                        return "Chỉ hỗ trợ JPG/PNG/WEBP";
                                    }

                                    return true;
                                },
                            }}
                            render={({ field, fieldState }) => (
                                <UploadImageBox
                                    value={field.value}
                                    onChange={field.onChange}
                                    error={fieldState.error?.message}
                                    width='100%'
                                    height='300px'
                                    picker={true}
                                    message='Tải ảnh lên'
                                    Icon={<PiImageSquareLight size={60} />}
                                />

                            )}
                        />
                        {errors.image && <span className='form-message-error'>{errors.image?.message}</span>}

                    </div>
                    <div>
                        <div className='fw-bold mt-3'>Thư viện ảnh</div>
                        <div>
                            <Controller
                                control={control}
                                name='gallery'
                                rules={{
                                    required: "Vui lòng chọn ảnh",
                                    validate: (value) => {
                                        if (!value || value.length === 0) return "Vui lòng chọn ít nhất 1 ảnh";

                                        for (const item of value) {
                                            // SỬA ĐOẠN NÀY: Check xem có phải là File không
                                            if (!(item instanceof File)) {
                                                // Nếu không phải File (tức là Image object cũ), coi như hợp lệ, bỏ qua check size
                                                continue;
                                            }

                                            // Validate file mới
                                            if (item.size > 5 * 1024 * 1024) return "Mỗi ảnh tối đa 5MB";
                                            const okTypes = ["image/jpeg", "image/png", "image/webp"];
                                            if (!okTypes.includes(item.type)) return "Chỉ hỗ trợ JPG/PNG/WEBP";
                                        }
                                        return true;

                                        return true;
                                    },
                                }}
                                render={({ field, fieldState }) => {
                                    const previewValues = (field.value || []).map(item => {
                                        if (item instanceof File) return item;
                                        // Nếu là Image object { imageUrl, ... } thì trả về imageUrl
                                        if (typeof item === 'object' && 'imageUrl' in item) return item.imageUrl;
                                        return item; // Fallback
                                    });
                                    return (
                                        <UploadImageBox
                                            value={previewValues}
                                            onChange={field.onChange}
                                            error={fieldState.error?.message}
                                            multiple={true}
                                            width='80px'
                                            height='80px'
                                            picker={true}
                                            message=''
                                            Icon={<IoAdd size={20} />}
                                        />

                                    )
                                }
                                }
                            />
                            {errors.gallery && <span className='form-message-error'>{errors.gallery?.message}</span>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GeneralTabs