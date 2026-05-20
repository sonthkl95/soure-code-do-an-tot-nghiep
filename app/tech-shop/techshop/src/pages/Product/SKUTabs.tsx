import React, { useMemo, useState } from 'react'
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import type { DiscontinuedForm, Group, ProductFormUI, SKU, Val } from '../../types/product.type';
import { IoMdAdd } from 'react-icons/io';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { IoClose } from 'react-icons/io5';
import UploadImageBox from '../../components/common/UploadImageBox';
import { PiEyeSlashThin, PiEyeThin, PiImageSquareThin } from 'react-icons/pi';
import { GoCircleSlash, GoStack } from 'react-icons/go';
import { hasText, slugify } from '../../utils/string';
import { HiOutlineLockClosed, HiOutlineLockOpen } from 'react-icons/hi2';
import { useDiscontinuedSkuMutation } from '../../features/product/product.api';
import { Modal } from 'react-bootstrap';



const SKUTabs = ({ mode }: { mode: "create" | "edit" }) => {
    const idemKey = useMemo(() => crypto.randomUUID(), [])
    const { register, control, setValue, getValues, formState: { errors } } = useFormContext<ProductFormUI>();
    const attributesOptions = useWatch({ name: "attributeOptions", control })
    const productName = useWatch({ name: "name", control })
    const category = useWatch({ name: "category", control })
    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "skuOptions",
        keyName: "_id"
    })
    const watchedSkuOptions = useWatch({ name: "skuOptions", control }) ?? [];
    const { fields: skuFields, replace: replaceSkus, update: updateSkus, remove: removeSku } = useFieldArray({
        control,
        name: "skus",
        keyName: "skuId"
    })
    const newGroup = (name?: string, value?: string): Group => ({
        id: crypto.randomUUID(),   // nếu env không support, xem fallback bên dưới
        name: name ?? "",
        value: value ?? "",
        values: [],
    });
    const addItemGroup = () => {
        const skusNow = getValues("skus") ?? [];
        const olGroups = getValues("skuOptions") ?? [];
        let newGroups: Group[] = [...olGroups]
        if (watchedSkuOptions.length == 0) {
            const drafValue = getValues("draft")
            const oldGroup = newGroup(drafValue?.name, drafValue?.value)
            append(oldGroup)
            newGroups = [...newGroups, oldGroup]
        }
        const nextGroup = newGroup()
        append(nextGroup);
        newGroups = [...newGroups, nextGroup]
        // ✅ Khi thêm group mới (rỗng) => không cho tồn tại SKU partial
        // (vì requireAllGroupsHaveValues = true)
        if (skusNow.length > 0) replaceSkus([]);
        handleGenerateSkus(newGroups, skusNow);
    };
    const deleteItemGroup = (index: number) => {
        const current = watchedSkuOptions;
        const next = current.filter((_, i) => i !== index);

        remove(index);
        const skusNow = getValues("skus") ?? [];
        handleGenerateSkus(next, skusNow);
    };
    const convertToSkus = (arr: Group[]) => {
        // 1. Chỉ lấy những nhóm đã thực sự có giá trị (values.length > 0)
        const validGroups = (arr ?? []).filter((g) => (g.values ?? []).length > 0);

        if (validGroups.length === 0) return [];

        const valuesArrays: Val[][] = validGroups.map((item) => item.values ?? []);

        // 2. Thực hiện tính toán tổ hợp (Cartesian Product)
        return valuesArrays.reduce<Val[][]>(
            (acc, cur) => acc.flatMap((a) => cur.map((b) => [...a, b])),
            [[] as Val[]]
        );
    };
    const removeVietnameseTones = (str: string) => {
        if (!str) return '';

        // 1. Chuyển đổi sang dạng tổ hợp (VD: 'á' -> 'a' + '´')
        str = str.normalize('NFD');

        // 2. Xóa các ký tự dấu (nằm trong dải unicode từ \u0300 đến \u036f)
        str = str.replace(/[\u0300-\u036f]/g, '');

        // 3. Xử lý chữ Đ/đ (Normalize không tách được chữ này)
        str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');

        return str;
    }
    const skuKeyFromAttrs = (attrs: Val[]) =>
        [...attrs]
            .sort((a, b) =>
                `${a.groupId}:${a.id}`.localeCompare(`${b.groupId}:${b.id}`)
            )
            .map(a => `${a.groupId}:${a.id}`)
            .join("|");

    const countOld = (attrs: Val[] = []) =>
        attrs.reduce((sum, x) => sum + (x.isOldData ? 1 : 0), 0);

    const handleGenerateSkus = (options: Group[], currentSkus: SKU[]) => {
        // const requireAllGroupsHaveValues = true; // ✅ fix chính: không gen "partial"
        const combos = convertToSkus(options);

        // tất cả value id hiện có trong options (kể cả active=false)
        const allValueIds = new Set((options ?? []).flatMap((g) => (g.values ?? []).map((v) => v.id)));

        const existingByKey = new Map(currentSkus.map((s) => [s.key, s]));
        const generated: SKU[] = [];

        for (const attrs of combos) {
            const key = skuKeyFromAttrs(attrs);
            const existingSku = existingByKey.get(key);

            // ✅ SKU mới: chặn nếu combo có >=2 old (theo rule của bạn)
            if (!existingSku && countOld(attrs) >= 2) continue;

            const skuString = attrs.map((s) => s.value).join("-");
            const skuCode = removeVietnameseTones(slugify((productName?.trim() || category?.slug || "") + "-" + skuString));

            generated.push({
                ...existingSku,
                key,
                id: existingSku?.id ?? "",
                image: existingSku?.image || null,
                skuCode: existingSku?.skuCode || skuCode,
                name:
                    existingSku?.name ||
                    (productName?.trim() || category?.name || "") + " " + attrs.map((s) => s.value).join(" "),
                price: existingSku?.price ?? 0,
                originalPrice: existingSku?.originalPrice ?? 0,
                stock: existingSku?.stock ?? 0,
                costPrice: existingSku?.costPrice ?? 0,
                active: existingSku?.active ?? true,
                discontinued: existingSku?.discontinued ?? false,
                attributes: attrs,
            });

            existingByKey.delete(key);
        }

        // ✅ create: KHÔNG giữ "remainingOldSkus"
        // ✅ edit: mới giữ theo rule legacy/old-data
        if (mode === "edit") {
            const remainingOldSkus = Array.from(existingByKey.values()).filter((sku) => {
                const oldCount = countOld(sku.attributes ?? []);

                // 1) legacy sku (>=2 old) -> giữ luôn
                if (oldCount >= 2) return true;

                // 2) sku thường: chỉ giữ nếu các value vẫn tồn tại trong options
                return (sku.attributes ?? []).every((a) => allValueIds.has(a.id));
            });

            replaceSkus([...generated, ...remainingOldSkus]);
            return;
        }

        // mode=create
        replaceSkus(generated); // nếu combos rỗng => [] (không gen partial nữa)
    };





    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key !== "Enter") return;
        e.preventDefault();

        const skuOptionsNow = getValues("skuOptions") ?? [];

        // CREATE + chưa có group nào: tạo group đầu tiên từ draft
        if (skuOptionsNow.length === 0 && mode === "create") {
            const name = getValues("draft.name")?.trim();
            const value = getValues("draft.value")?.trim();

            if (!name || !value || normalizeName(value) === normalizeName(name)) {
                toast.error("Vui lòng nhập giá trị phân loại");
                return;
            }
            const oldSkuOption = getValues("skuOptions")
            const newId = crypto.randomUUID();
            const newGroup = {
                id: newId,
                name,
                value: "",
                values: [
                    {
                        groupId: newId,
                        id: crypto.randomUUID(),
                        value,
                        active: true,
                        isOldData: false,
                    },
                ],
            }
            append(newGroup);

            // clear draft value cho UX
            setValue("draft.value", "", { shouldDirty: true });

            const nextSkuOptions = [...oldSkuOption, { ...newGroup }];
            const skusNow = getValues("skus") ?? [];
            handleGenerateSkus(nextSkuOptions, skusNow);
            return;
        }

        // ADD VALUE vào group hiện tại
        const currentGroup = skuOptionsNow[index];
        if (!currentGroup) return;

        const name = (currentGroup.name ?? "").trim();
        const value = (currentGroup.value ?? "").trim();

        if (!name || !value || normalizeName(name) === normalizeName(value)) {
            toast.error("Dữ liệu không hợp lệ");
            return;
        }

        const existedValues = currentGroup.values ?? [];
        const existedNames = existedValues.map((v) => normalizeName(v.value ?? ""));
        if (existedNames.includes(normalizeName(value))) {
            toast.error("Dữ liệu không hợp lệ");
            return;
        }

        const newVal: Val = {
            groupId: currentGroup.id,
            id: crypto.randomUUID(),
            value,
            active: true,
            isOldData: false,
        };

        const nextGroup: Group = {
            ...currentGroup,
            values: [...existedValues, newVal],
            value: "",
        };

        update(index, nextGroup);
        setValue(`skuOptions.${index}.value` as any, "");

        const nextSkuOptions = skuOptionsNow.map((g, i) => (i === index ? nextGroup : g));
        const skusNow = getValues("skus") ?? [];
        handleGenerateSkus(nextSkuOptions, skusNow);
    };

    const normalizeName = (name: string) => {
        return name.trim().replaceAll(/\s+/g, " ").toLowerCase();
    }
    const handDeleteValue = (groupIndex: number, valueId: string) => {
        const currentOptions = getValues("skuOptions") ?? [];
        const currentGroup = currentOptions[groupIndex];
        if (!currentGroup) return;

        const target = (currentGroup.values ?? []).find(v => v.id === valueId);
        if (!target) return;

        if (target.isOldData) {
            toast.error("Giá trị cũ không thể xoá");
            return;
        }

        const nextValues = (currentGroup.values ?? []).filter(v => v.id !== valueId);
        const nextGroup = { ...currentGroup, values: nextValues };

        update(groupIndex, nextGroup);

        const nextSkuOptions = currentOptions.map((g, i) =>
            i === groupIndex ? nextGroup : g
        );
        const skusNow = getValues("skus") ?? [];
        handleGenerateSkus(nextSkuOptions, skusNow);
    };


    const onlyNumberNoLeadingZero = (value: string) => {
        // 1. Xóa mọi ký tự không phải số
        let v = value.replace(/\D+/g, '');

        // 2. Xóa số 0 ở đầu (nhưng giữ lại "0" nếu chỉ có 0)
        v = v.replace(/^0+(?=\d)/, '');

        return v;
    };
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
    const handleBulkApplyAll = () => {

        const skusValue = getValues("skus") ?? []
        const bulk = getValues("bulk")
        skusValue.forEach((sku, i) => {
            if (!sku?.discontinued) {
                if (bulk.price !== null && bulk.price != null)
                    setValue(`skus.${i}.price`, bulk.price, { shouldDirty: true, shouldValidate: false });

                if (bulk.costPrice !== null && bulk.costPrice != null)
                    setValue(`skus.${i}.costPrice`, bulk.costPrice, { shouldDirty: true, shouldValidate: false });

                if (bulk.originalPrice !== null && bulk.originalPrice != null)
                    setValue(`skus.${i}.originalPrice`, bulk.originalPrice, { shouldDirty: true, shouldValidate: false });

                if (bulk.stock !== null && bulk.stock != null)
                    setValue(`skus.${i}.stock`, bulk.stock, { shouldDirty: true, shouldValidate: false });
            }
        })
    };
    const [discontinuedSelected, setDiscontinuedSelected] = useState<SKU | null>();
    const [reason, setReason] = useState<string>("");
    const [openModalDiscontinued, setOpenModalDiscontinued] = useState<boolean>(false)
    const closeDiscontinued = () => {
        setOpenModalDiscontinued(false);
    }
    const [discontinuedSku, { isLoading: isLoadingDiscontinued }] = useDiscontinuedSkuMutation();
    const handleConfirmDiscontinued = async () => {
        const payload: DiscontinuedForm = {
            discontinued: true,
            reason: reason
        }
        await discontinuedSku({ id: discontinuedSelected?.id ?? "", idemKey: idemKey, body: payload })
        setReason("")
        setDiscontinuedSelected(null)
        setOpenModalDiscontinued(false)
    }
    const toggleValueActive = (groupIndex: number, valueId: string) => {
        // 1) Toggle option.active
        const skuOptions = getValues("skuOptions") ?? [];
        const currentGroup = skuOptions[groupIndex];
        if (!currentGroup) return;

        const target = (currentGroup.values ?? []).find(v => v.id === valueId);
        if (!target) return;

        const nextActive = !target.active;

        const nextSkuOptions = skuOptions.map((group, idx) => {
            if (idx !== groupIndex) return group;
            return {
                ...group,
                values: (group.values ?? []).map(item =>
                    item.id === valueId ? { ...item, active: nextActive } : item
                ),
            };
        });

        setValue("skuOptions", nextSkuOptions, { shouldDirty: true, shouldTouch: true });

        // 2) Nếu option vừa bị ẩn (active=false) => ép SKU dùng option đó về inactive
        if (!nextActive) {
            const skusNow = getValues("skus") ?? [];
            const nextSkus = skusNow.map(sku => {
                const used = (sku.attributes ?? []).some(a => a.id === valueId);
                if (!used) return sku;
                if (sku.active === false) return sku; // đã false thì thôi
                return { ...sku, active: false };
            });

            replaceSkus(nextSkus);
        }

        // 3) Nếu option bật lại (active=true) => KHÔNG làm gì với SKU (giữ nguyên)
    };

    const skuHasNewOption = (sku?: SKU) =>
        (sku?.attributes ?? []).some(a => a.isOldData === false);
    return (
        <div className='px-4'>
            {attributesOptions != null && attributesOptions.length > 0 ?
                (
                    <div className='row'>
                        <div className='col-4 d-flex flex-column gap-3'>
                            <div className='f-meta f-bold form-label mb-0'>Cấu hình nhóm phân loại</div>
                            <div className='f-caption'>Thêm các nhóm như Màu sắc, Kích thước.</div>
                            {fields && fields.length > 0 ? fields?.map((field, index) => (
                                <div key={field._id} className='form-app border-app--rounded p-3'>
                                    <div>
                                        <div className='d-flex align-items-center justify-content-between'>
                                            <label htmlFor={"name" + index} className='f-body-sm fw-bold'>Tên nhóm phân loại {index + 1}</label>
                                            {(mode == "create" && fields.length > 1) && fields.flatMap(it => it.values).some(it => !it.isOldData) &&
                                                <button type='button' onClick={() => deleteItemGroup(index)} className='btn btn-secondary border-0 bg-transparent text-secondary'>
                                                    <RiDeleteBin6Line />
                                                </button>}
                                        </div>

                                        <input {...register(`skuOptions.${index}.name`)} className="form-control form-control-sm" id={"name" + index} type="text" placeholder='ví dụ: Màu sắc' />
                                    </div>
                                    <div className='d-flex align-items-center gap-2'>
                                        {field.values.map(v => (
                                            <span key={v.id} className='d-inline-block ps-2 bg-neutral-200 f-caption'>
                                                <span>{v.value}</span>
                                                {v.isOldData ? (
                                                    <button onClick={() => toggleValueActive(index, v.id)} type='button' className='border-0 bg-transparent'>
                                                        {v.active ? (<PiEyeSlashThin />) : (<PiEyeThin />)}
                                                    </button>
                                                ) : (

                                                    <button type='button' onClick={() => handDeleteValue(index, v.id)} className='border-0 bg-transparent'>
                                                        <IoClose />
                                                    </button>
                                                )}
                                            </span>

                                        ))}
                                    </div>
                                    <div>
                                        <label htmlFor={"value" + index} className='f-body-sm fw-bold'>Giá trị (Nhập & Enter) {index + 1}</label>
                                        <input {...register(`skuOptions.${index}.value`)} onKeyDown={(e) => handleKeyDown(e, index)} className="form-control form-control-sm" id={"value" + index} type="text" placeholder='Nhập giá trị...' />
                                    </div>
                                </div>
                            )) : (
                                <div className='form-app border-app--rounded p-3'>
                                    <div>
                                        <div className='d-flex align-items-center justify-content-between'>
                                            <label htmlFor="name1" className='f-body-sm fw-bold'>Tên nhóm phân loại 1</label>
                                        </div>

                                        <input {...register("draft.name", {
                                            required: true
                                        })} type="input" className={`form-control form-control-sm ${errors.draft?.name && "is-invalid"}`} id="name1" type="text" placeholder='ví dụ: Màu sắc' />
                                    </div>
                                    <div>
                                        <label htmlFor="value1" className='f-body-sm fw-bold'>Giá trị (Nhập & Enter)</label>
                                        <input {...register("draft.value", {
                                            required: true
                                        })} onKeyDown={(e) => handleKeyDown(e, 1)} className={`form-control form-control-sm ${errors.draft?.name && "is-invalid"}`} id="value1" type="text" placeholder='Nhập giá trị...' />
                                    </div>
                                </div>
                            )}
                            {mode == "create" && (
                                <button type='button' onClick={addItemGroup} className='btn-app btn-app--ghost btn-app-icon border-dashed bg-neutral-100 w-100'>
                                    <IoMdAdd />
                                    <span>Thêm nhóm phân loại</span>
                                </button>
                            )}
                        </div>
                        <div className='col-8 form-app flex-column'>
                            <div className='f-meta f-bold form-label mb-0'>Danh sách biến thể (SKU)</div>
                            <div className='f-caption'>Vui lòng thêm nhóm phân loại để tạo biến thể.</div>
                            <div className='form-app'>
                                <div className='row'>
                                    <div className='col-3'>
                                        <label className='form-label' htmlFor="bulk-price">Giá bán</label>
                                        <Controller
                                            control={control}
                                            name='bulk.price'
                                            render={({ field }) => (
                                                <input id='bulk-price' className='form-control form-control-sm' type="text"
                                                    value={field.value}
                                                    onKeyDown={allowNumberAndDotNoLeadingDotKeyDown}
                                                    onChange={(e) => field.onChange(normalizeNumberDotOnChange(e.target.value))}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className='col-3'>
                                        <label className='form-label' htmlFor="bulk-costPrice">Giá gốc</label>
                                        <Controller
                                            control={control}
                                            name='bulk.costPrice'
                                            render={({ field }) => (
                                                <input id='bulk-costPrice' className='form-control form-control-sm' type="text"
                                                    value={field.value}
                                                    onKeyDown={allowNumberAndDotNoLeadingDotKeyDown}
                                                    onChange={(e) => field.onChange(normalizeNumberDotOnChange(e.target.value))}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className='col-3'>
                                        <label className='form-label' htmlFor="bulk-originalPrice">Giá niêm yết</label>
                                        <Controller
                                            control={control}
                                            name='bulk.originalPrice'
                                            render={({ field }) => (
                                                <input id='bulk-originalPrice' className='form-control form-control-sm' type="text"
                                                    value={field.value}
                                                    onKeyDown={allowNumberAndDotNoLeadingDotKeyDown}
                                                    onChange={(e) => field.onChange(normalizeNumberDotOnChange(e.target.value))}
                                                />
                                            )}
                                        />
                                    </div>
                                    {mode == "create" && (
                                        <div className='col-3'>
                                            <label className='form-label' htmlFor="bulk-stock">Số lượng</label>
                                            <Controller
                                                control={control}
                                                name='bulk.stock'
                                                render={({ field }) => (
                                                    <input id='bulk-stock' className='form-control form-control-sm' type="text"
                                                        value={field.value}
                                                        onKeyDown={allowOnlyNumberKeyDown}
                                                        onChange={(e) => field.onChange(onlyNumberNoLeadingZero(e.target.value))}
                                                    />
                                                )}
                                            />
                                        </div>
                                    )}
                                    <div className='d-flex align-items-end col-12 mt-2'>
                                        <button onClick={handleBulkApplyAll} type='button' className='btn-app btn-app--sm'>
                                            Áp dụng hàng loạt
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {skuFields && skuFields.length > 0 ? (
                                <div className='table-responsive'>
                                    <table className='table-app' style={{ width: 800 }}>
                                        <thead>
                                            <tr>
                                                <th scope='col'>Ảnh</th>
                                                <th scope='col'>Tên biến thể</th>
                                                <th scope='col'>Giá bán</th>
                                                <th scope='col'>Giá gốc</th>
                                                <th scope='col'>Giá niêm yết</th>
                                                {mode == "create" && (
                                                    <th scope='col'>Kho</th>
                                                )}
                                                <th scope='col'>Mã SKU</th>
                                                <th scope='col'>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {skuFields.map((item, index) => (
                                                <tr key={item.skuId}>
                                                    <td>
                                                        <Controller
                                                            control={control}
                                                            name={`skus.${index}.image`}
                                                            rules={{
                                                                required: {
                                                                    value: true,
                                                                    message: "Ảnh không được để trống"
                                                                }
                                                            }}
                                                            render={({ field, fieldState }) => (
                                                                <UploadImageBox
                                                                    value={field.value}
                                                                    picker={true}
                                                                    disabled={item.discontinued}
                                                                    message=''
                                                                    error={fieldState.error?.message}
                                                                    width='36px'
                                                                    height='36px'
                                                                    Icon={<PiImageSquareThin />}
                                                                    onChange={field.onChange}
                                                                />
                                                            )}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Controller
                                                            control={control}
                                                            name={`skus.${index}.name`}
                                                            rules={{
                                                                required: {
                                                                    value: true,
                                                                    message: "Tên không được để trống"
                                                                }
                                                            }}
                                                            render={({ field, fieldState }) => (
                                                                <div className='d-flex flex-column justify-content-start'>
                                                                    <input
                                                                        className={`form-control form-control-sm ${fieldState.error && "is-invalid"}`}
                                                                        type="text"
                                                                        disabled={item.discontinued}

                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        style={{ width: 'fit-content' }} />

                                                                </div>
                                                            )}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Controller
                                                            control={control}
                                                            name={`skus.${index}.price`}
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
                                                                <div className='d-flex flex-column justify-content-start'>
                                                                    <input
                                                                        className={`form-control form-control-sm ${fieldState.error && "is-invalid"}`}
                                                                        type="text"
                                                                        disabled={item.discontinued}
                                                                        onKeyDown={allowNumberAndDotNoLeadingDotKeyDown}
                                                                        value={field.value}
                                                                        onChange={(e) => field.onChange(normalizeNumberDotOnChange(e.target.value))}
                                                                        style={{ minWidth: 100 }} />

                                                                </div>
                                                            )}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Controller
                                                            control={control}
                                                            name={`skus.${index}.costPrice`}
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
                                                                <div className='d-flex flex-column justify-content-start'>
                                                                    <input
                                                                        className={`form-control form-control-sm ${fieldState.error && "is-invalid"}`}
                                                                        type="text"
                                                                        disabled={item.discontinued}
                                                                        onKeyDown={allowNumberAndDotNoLeadingDotKeyDown}
                                                                        value={field.value}
                                                                        onChange={(e) => field.onChange(normalizeNumberDotOnChange(e.target.value))}
                                                                        style={{ minWidth: 100 }} />

                                                                </div>
                                                            )}
                                                        />
                                                    </td>
                                                    <td>
                                                        <Controller
                                                            control={control}
                                                            name={`skus.${index}.originalPrice`}
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
                                                                <div className='d-flex flex-column justify-content-start'>
                                                                    <input
                                                                        className={`form-control form-control-sm ${fieldState.error && "is-invalid"}`}
                                                                        type="text"
                                                                        disabled={item.discontinued}
                                                                        onKeyDown={allowNumberAndDotNoLeadingDotKeyDown}
                                                                        value={field.value}
                                                                        onChange={(e) => field.onChange(normalizeNumberDotOnChange(e.target.value))}
                                                                        style={{ minWidth: 100 }} />

                                                                </div>
                                                            )}
                                                        />
                                                    </td>
                                                    {mode == "create" && (
                                                        <td>
                                                            <Controller
                                                                control={control}
                                                                name={`skus.${index}.stock`}
                                                                rules={{
                                                                    required: {
                                                                        value: true,
                                                                        message: "Tồn kho không được để trống"
                                                                    },
                                                                    validate: {
                                                                        equalZero: (v) =>
                                                                            Number(v) > 0 || "Giá trị phải lớn hơn 0"
                                                                    }
                                                                }}
                                                                render={({ field, fieldState }) => (
                                                                    <div className='d-flex flex-column justify-content-start'>
                                                                        <input type="text"
                                                                            className={`form-control form-control-sm ${fieldState.error && "is-invalid"}`}
                                                                            value={field.value}
                                                                            disabled={item.discontinued}
                                                                            onKeyDown={allowOnlyNumberKeyDown}
                                                                            onChange={(e) => {
                                                                                const clean = onlyNumberNoLeadingZero(e.target.value)
                                                                                field.onChange(clean);
                                                                            }} style={{ minWidth: 100 }} />

                                                                    </div>
                                                                )}
                                                            />
                                                        </td>
                                                    )}

                                                    <td>
                                                        <Controller
                                                            control={control}
                                                            name={`skus.${index}.skuCode`}
                                                            rules={{
                                                                required: {
                                                                    value: true,
                                                                    message: "Mã Sku không được để trống"
                                                                }
                                                            }}
                                                            render={({ field, fieldState }) => {
                                                                const rowSku = getValues(`skus.${index}` as const);
                                                                const disabledSkuCode = mode === "edit" && !skuHasNewOption(rowSku);

                                                                return (
                                                                    <div>
                                                                        <input
                                                                            type="text"
                                                                            className={`form-control form-control-sm ${fieldState.error && "is-invalid"}`}
                                                                            value={field.value}
                                                                            disabled={disabledSkuCode}
                                                                            onChange={field.onChange}
                                                                            style={{ width: "fit-content" }}
                                                                        />
                                                                    </div>
                                                                );
                                                            }}
                                                        />
                                                    </td>
                                                    <td className='col-actions'>
                                                        <div className='table-actions'>
                                                            <button type='button' disabled={item.discontinued} className='action-btn' onClick={() => updateSkus(index, {
                                                                ...item,
                                                                active: !item.active
                                                            })}>
                                                                {item.active ? <HiOutlineLockClosed /> : <HiOutlineLockOpen />}
                                                            </button>
                                                            {mode == "create" || !(mode === "edit" && !skuHasNewOption(getValues(`skus.${index}` as const))) &&
                                                                <button type='button' className='action-btn action-btn--danger' onClick={() => removeSku(index)}>
                                                                    <RiDeleteBin6Line />
                                                                </button>
                                                            }
                                                            {mode == "edit" && !getValues(`skus.${index}.discontinued`) &&
                                                                <button type='button' className='action-btn action-btn--danger' onClick={() => {
                                                                    setDiscontinuedSelected(getValues(`skus.${index}`))
                                                                    setOpenModalDiscontinued(true)
                                                                }}>
                                                                    <GoCircleSlash />
                                                                </button>
                                                            }
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                            ) : (
                                <div className='d-flex align-items-center gap-1 f-hint flex-column justify-content-center my-5'>
                                    <GoStack size={60} />
                                    <span className='f-body'>Chưa có biến thể nào được tạo.</span>
                                    <span className='f-body-3xs'>Thêm nhóm phân loại ở cột bên trái để bắt đầu.</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className='d-flex align-items-center justify-content-center p-5 bg-neutral-100 rounded mt-4'>
                        <span>Vui lòng chọn danh mục trước.</span>
                    </div >
                )
            }
            <Modal
                show={openModalDiscontinued}
                onHide={closeDiscontinued}
                centered
                dialogClassName="modal-app"
                backdropClassName="modal-app-backdrop"
            >
                <Modal.Header>
                    <Modal.Title>
                        <span className="fw-bold fs-5">Xác nhận ngừng kinh doanh</span>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <div className="mb-2">Bạn có chắc chắn muốn ngừng kinh doanh mặt hàng này:</div>

                    <div
                        className="p-3 rounded"
                        style={{
                            background: "var(--neutral-50)",
                            border: "1px solid var(--app-border)",
                        }}
                    >
                        <div className="fw-semibold">{discontinuedSelected?.name}</div>
                        <div className="text-muted" style={{ color: "var(--app-text-muted)" }}>
                            ID: {discontinuedSelected?.id}
                        </div>
                    </div>
                    <div className='mt-3 form-app'>
                        <label className='form-label mb-0' htmlFor='reason'>Lý do: <span className='text-danger'>*</span></label>
                        <input id='reason' type="text" className='form-control'
                            onChange={(e) => setReason(e.target.value)}
                            placeholder='Nhập lý do' />
                    </div>
                    <div className="mt-3" style={{ color: "var(--app-text-muted)" }}>
                        Hành động này không thể hoàn tác.
                    </div>
                </Modal.Body>

                <Modal.Footer>
                    <button
                        type="button"
                        className="btn-app btn-app--sm btn-app--ghost p-3"
                        onClick={closeDiscontinued}
                        disabled={isLoadingDiscontinued}
                    >
                        Huỷ
                    </button>
                    <button
                        type="button"
                        className="btn-app btn-app--sm btn-app--danger"
                        onClick={handleConfirmDiscontinued}
                        disabled={isLoadingDiscontinued || !hasText(reason.trim())}
                    >
                        <GoCircleSlash />
                        {/* {isDeleting ? "Đang xoá..." : "Xoá"} */}
                    </button>
                </Modal.Footer>
            </Modal>
        </div >
    )
}

export default SKUTabs