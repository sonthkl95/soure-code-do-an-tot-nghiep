import { FormProvider, useForm, useWatch, type SubmitHandler } from "react-hook-form"
import type { Attribute, ProductCreateForm, ProductFormUI, SKU, SkuCreateForm } from "../../types/product.type"
import { useNavigate } from "react-router";
import { RiSaveLine } from "react-icons/ri";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { BsBox } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import { TbNotes } from "react-icons/tb";
import { GoStack } from "react-icons/go";
import GeneralTabs from "./GeneralTabs";
import DescriptionTabs from "./DescriptionTabs";
import AttributeTabs from "./AttributeTabs";
import SKUTabs from "./SKUTabs";
import { useCreateProductMutation } from "../../features/product/product.api";
import { toast } from "react-toastify";
import { useEffect, useMemo, useRef, useState } from "react";

const ProductCreate = () => {
    const navigate = useNavigate();
    const [isLoadingTimeOut, setIsLoadingTimeOut] = useState<boolean>(false)

    const idemKey = useMemo(() => crypto.randomUUID(), [])
    const methods = useForm<ProductFormUI>({
        defaultValues: {
            name: "",
            slug: "",
            shortDescription: "",
            description: "",
            hasVariants: false,
            price: 0,
            originalPrice: 0,
            costPrice: 0,
            stock: 0,
            skuOptions: [],
            skus: []
        },
        shouldUnregister: false
    });

    const {
        handleSubmit,
        control
    } = methods;
    const hasVariants = useWatch({ name: "hasVariants", control })
    const [createProduct, { isLoading }] = useCreateProductMutation()
    const onSubmit: SubmitHandler<ProductFormUI> = async (data: ProductFormUI) => {
        try {
            const hasVariants = data.hasVariants;
            let skus: SkuCreateForm[] = [];
            if (!hasVariants) {
                skus = [{
                    name: data.name,
                    skuCode: data.slug,
                    price: data.price ?? 0,
                    costPrice: data.costPrice ?? 0,
                    originalPrice: data.originalPrice ?? 0,
                    stock: data.stock ?? 0,
                    active: true,
                    attributes: [],
                    image: null
                }]
            } else {
                skus = data.skus.map(item => ({
                    name: item.name,
                    skuCode: item.skuCode,
                    price: item.price,
                    costPrice: item.costPrice,
                    originalPrice: item.originalPrice,
                    stock: item.stock,
                    active: item.active,
                    attributes: item.attributes,
                    image: item.image as File ? item.image : null
                }))
            }

            const payload: ProductCreateForm = {
                name: data.name.trim(),
                slug: data.slug.trim(),
                brandId: data.brandId,
                categoryId: data.category.id,
                specs: data.attributes,
                hasVariants: data.hasVariants,
                description: data.description,
                shortDescription: data.shortDescription.trim(),
                warrantyMonth: data.warrantyMonth,
                attributes: data.skuOptions.filter(at => at.values.length > 0),
                thumbnail: data.image as File,
                gallery: data.gallery as File[],
                skus: skus,
            }

            console.log({ payload });

            const fd = new FormData()
            fd.append("name", payload.name)
            fd.append("slug", payload.slug)
            fd.append("brandId", payload.brandId)
            fd.append("categoryId", payload.categoryId)
            fd.append("description", payload.description)
            fd.append("shortDescription", payload.shortDescription)
            fd.append("warrantyMonth", String(payload.warrantyMonth))
            fd.append("hasVariants", String(payload.hasVariants))
            const specsToSend = prepareSpecs(payload.specs);

            fd.append("specs", JSON.stringify(specsToSend))
            payload.attributes.forEach((at, index) => {
                fd.append(`attributes[${index}].id`, at.id)
                fd.append(`attributes[${index}].label`, at.name)
                at.values.forEach((a, indexA) => {
                    fd.append(`attributes[${index}].values[${indexA}].id`, a.id)
                    fd.append(`attributes[${index}].values[${indexA}].value`, a.value)
                    fd.append(`attributes[${index}].values[${indexA}].active`, JSON.stringify(a.active))
                })
            })
            fd.append("thumbnail", payload.thumbnail)
            payload.gallery.forEach((file) => {
                fd.append("gallery", file)
            })
            payload.skus.forEach((sku, index) => {
                fd.append(`skus[${index}].code`, sku.skuCode);
                fd.append(`skus[${index}].name`, sku.name);
                fd.append(`skus[${index}].price`, String(sku.price));
                fd.append(`skus[${index}].costPrice`, String(sku.costPrice));
                fd.append(`skus[${index}].active`, String(sku.active));
                fd.append(`skus[${index}].originalPrice`, String(sku.originalPrice));
                fd.append(`skus[${index}].stock`, String(sku.stock));
                sku.attributes.forEach((op, indexOp) => {
                    fd.append(`skus[${index}].specs[${indexOp}].id`, String(op.id))
                    fd.append(`skus[${index}].specs[${indexOp}].groupId`, String(op.groupId))
                })
                if (sku.image) {
                    fd.append(`skus[${index}].image`, sku.image);
                }
            })
            const res = await createProduct({ idemKey, body: fd }).unwrap();
            toast.success(res?.message ?? "Tạo sản phẩm thành công");

            setTimeout(() => {
                navigate("/products", { replace: true })
                setIsLoadingTimeOut(false)
            }, 1200);
        } catch (error: any) {
            toast.error(error?.data?.message ?? "Có lỗi xảy ra");
        }
    }
    const prepareSpecs = (rawAttributes: Attribute[]) => {
        return rawAttributes.map(attr => {
            let finalValue = attr.value;

            // Logic giữ type (Ví dụ minh họa)
            if (Array.isArray(attr.value)) {
                // Nếu là mảng ["HDMI", "USB"], giữ nguyên
                finalValue = attr.value;
            } else if (attr.value === "true" || attr.value === "false") {
                // Convert string "true" -> boolean true
                finalValue = (attr.value === "true");
            } else if (!isNaN(Number(attr.value)) && attr.value !== "") {
                // Convert string "12" -> number 12
                finalValue = Number(attr.value);
            }

            // Trả về object sạch
            return {
                id: attr.id,
                code: attr.code,
                label: attr.label,
                dataType: attr.dataType,
                unit: attr.unit,
                displayOrder: attr.displayOrder,
                value: finalValue
            };
        });
    };
    const isDisablePage = isLoading || isLoadingTimeOut

    return (
        <div className="d-flex align-items-center justify-content-center">
            <div className="border-app--rounded bg-white m-4 py-4" style={{ width: "1000px" }}>
                <div className="d-flex align-items-center justify-content-between border-bottom px-4 pb-4">
                    <div>
                        <div className="fw-bold fs-6">Thêm sản phẩm mới</div>
                        <div className="f-caption">Điền thông tin chi tiết và cấu hình biến thể.</div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <button
                            className="btn-app btn-app--ghost btn-app--sm"
                            onClick={() => navigate(-1)}
                            disabled={isDisablePage}
                            type="button"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            form="product-form"
                            className="btn-app btn-app--sm d-flex align-items-center gap-2"
                            disabled={isDisablePage}
                        >
                            <RiSaveLine />
                            Lưu
                            {/* {isCreating ? "Đang lưu..." : "Lưu danh mục"} */}
                        </button>
                    </div>
                </div>
                <FormProvider {...methods} >
                    <form id="product-form" className="form-app pt-4"
                        onSubmit={handleSubmit(onSubmit)}>
                        <fieldset disabled={isLoading}>
                            <Tabs forceRenderTabPanel>
                                <TabList className="px-4 tablist">
                                    <Tab>
                                        <div><BsBox /> <span>Thông tin chung</span></div>
                                    </Tab>
                                    <Tab>
                                        <div><IoSettingsOutline /> <span>Thông số kỹ thuật</span></div>
                                    </Tab>
                                    {
                                        hasVariants && (
                                            <Tab>
                                                <div><GoStack /> <span>Phân loại & Biến thể</span></div>
                                            </Tab>
                                        )
                                    }
                                    <Tab>
                                        <div><TbNotes /> <span>Mô tả</span></div>
                                    </Tab>
                                </TabList>
                                <TabPanel>
                                    <GeneralTabs updating={isDisablePage} />
                                </TabPanel>
                                <TabPanel>
                                    <AttributeTabs updating={isDisablePage} />
                                </TabPanel>
                                {
                                    hasVariants && (
                                        <TabPanel>
                                            <SKUTabs mode="create" />
                                        </TabPanel>
                                    )
                                }
                                <TabPanel>
                                    <DescriptionTabs updating={isDisablePage} />
                                </TabPanel>
                            </Tabs>
                        </fieldset>
                    </form>
                </FormProvider>
            </div>
        </div>
    )
}

export default ProductCreate