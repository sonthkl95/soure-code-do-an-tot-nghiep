import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, type SubmitHandler } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { RiSaveLine } from "react-icons/ri";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { BsBox } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import { TbNotes } from "react-icons/tb";
import { GoStack } from "react-icons/go";
import { toast } from "react-toastify";

// Import các components tabs
import GeneralTabs from "./GeneralTabs";
import DescriptionTabs from "./DescriptionTabs";
import AttributeTabs from "./AttributeTabs";
import SKUTabs from "./SKUTabs";

// Import types và api
import type { ProductFormUI, ProductCreateForm, Attribute, Image, DataType, SkuSelect, VariantGroup, Val, ProductUpdateForm } from "../../types/product.type";
import { useGetProductByIdQuery, useUpdateProductMutation } from "../../features/product/product.api";
import { useLazyGetCategoryByIdQuery } from "../../features/category/category.api";

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const idemKey = useMemo(() => crypto.randomUUID(), [])
  const [isLoadingTimeOut, setIsLoadingTimeOut] = useState<boolean>(false)
  // API Hooks
  const { data: productData, isLoading: isFetching } = useGetProductByIdQuery(id ?? "", { skip: !id });
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [getCategoryDetail] = useLazyGetCategoryByIdQuery();

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
      skus: [],
      gallery: [],
      image: null,
      attributeOptions: [] // Quan trọng để render tab Thông số kỹ thuật
    },
  });

  const { handleSubmit, reset, watch } = methods;
  const hasVariants = watch("hasVariants");
  const skuKeyFromAttrs = (attrs: Val[]) =>
    [...attrs]
      .sort((a, b) =>
        `${a.groupId}:${a.id}`.localeCompare(`${b.groupId}:${b.id}`)
      )
      .map(a => `${a.groupId}:${a.id}`)
      .join("|");
  const valFromSelections = (selections: SkuSelect[], variantGroups: VariantGroup[]): Val[] => {
    const map = new Map<string, { value: string; groupId: string }>();

    variantGroups.forEach(g => {
      g.values.forEach(v => {
        map.set(v.id, { value: v.value, groupId: g.id });
      });
    });

    return selections.map(s => {
      const found = map.get(s.valueId);
      return {
        groupId: found?.groupId ?? s.groupId,
        id: s.valueId,                 // ✅ id = valueId
        value: found?.value ?? "",     // ✅ có value để render/name/skuCode
        active: true,
        isOldData: true,
      };
    });
  };
  // 1. Load dữ liệu và map vào Form
  useEffect(() => {
    if (productData) {
      const loadInitData = async () => {
        try {
          // Lấy thông tin Category để fill Attribute Options (cấu hình thông số)
          const catRes = await getCategoryDetail(productData.category.id).unwrap();

          // Map Attribute Options (Định nghĩa trường dữ liệu)
          const mappedAttributeOptions = (catRes.attributeConfigs ?? []).map(item => ({
            id: item.id,
            code: item.code,
            label: item.label,
            isRequired: item.isRequired,
            isFilterable: item.isFilterable,
            displayOrder: item.displayOrder,
            unit: item.unit,
            dataType: item.dataType as DataType, // Cần hàm convert nếu type không khớp string
            options: (item.optionsValue ?? []).map(ot => ({ id: ot.id, value: ot.id, label: ot.label })),
          }));
          // Map SKUs
          const mappedSkus = productData.skus.map(sku => {
            const attrs = valFromSelections(sku.selections, productData.variantGroups);
            return ({
              ...sku,
              key: skuKeyFromAttrs(attrs), // Dùng skuCode làm key tạm
              id: sku.id,
              skuCode: sku.skuCode,
              image: sku.thumbnail.imageUrl, // URL ảnh (string)
              name: sku.name,
              price: sku.price,
              costPrice: sku.costPrice,
              originalPrice: sku.originalPrice,
              active: sku.active == "ACTIVE",
              discontinued: !!sku.discontinued,
              stock: sku.stock,
              attributes: attrs

            })
          })



          // Reset form
          reset({
            id: productData.id,
            name: productData.name,
            slug: productData.slug,
            brandId: productData.brand.id,
            category: {
              id: productData.category.id,
              name: productData.category.name,
            },
            warrantyMonth: productData.warrantyMonth,
            shortDescription: productData.shortDescription,
            description: productData.description,
            hasVariants: productData.hasVariants,
            // Nếu có biến thể, giá ở ngoài thường là min price hoặc 0, tùy logic
            skuOptions: productData.variantGroups.map(it => ({
              id: it.id,
              name: it.label,
              value: "",
              values: it.values.map(v => ({
                groupId: it.id,
                value: v.value,
                id: v.id,
                active: v.active,
                isOldData: true
              })),
            })),
            image: productData.thumbnail.imageUrl, // URL string
            gallery: productData.gallery.map(it => it.imageUrl), // URL strings array

            attributes: productData.specs.map(it => ({
              id: it.id,
              code: it.code,
              label: it.label,
              dataType: it.dataType,
              unit: it.unit,
              value: it.value,
              displayOrder: it.displayOrder
            })), // Giá trị thông số kỹ thuật
            attributeOptions: mappedAttributeOptions, // Cấu hình thông số
            bulk: { price: 0, costPrice: 0, originalPrice: 0, stock: 0 },
            skus: mappedSkus, // Danh sách biến thể chi tiết

          });

        } catch (error) {
          console.log(error);

          toast.error("Lỗi khi tải dữ liệu sản phẩm");
        }
      };
      loadInitData();
    }
  }, [productData, reset, getCategoryDetail]);
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
  // 2. Xử lý Submit (Tương tự Create nhưng logic FormData khác một chút với File/String)
  const onSubmit: SubmitHandler<ProductFormUI> = async (data) => {
    if (!id) return;
    try {
      const skus = data.skus.map(item => ({
        id: item.id,
        name: item.name,
        skuCode: item.skuCode,
        price: item.price,
        costPrice: item.costPrice,
        originalPrice: item.originalPrice,
        stock: item.stock,
        active: item.active,
        attributes: item.attributes,
        image: item.image instanceof File ? item.image : null
      }))
      const payload: ProductUpdateForm = {
        id: data.id ?? id,
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
        thumbnail: data.image instanceof File ? data.image : null,
        gallery: (data.gallery ?? []).filter((x): x is File => x instanceof File),
        skus: skus,
      }
      const fd = new FormData();

      // Các trường cơ bản
      fd.append("id", data.id?.trim() ?? id)
      fd.append("name", data.name.trim());
      fd.append("slug", data.slug.trim());
      fd.append("brandId", data.brandId);
      fd.append("categoryId", data.category.id);
      fd.append("description", data.description);
      fd.append("shortDescription", data.shortDescription);
      fd.append("warrantyMonth", String(data.warrantyMonth));
      fd.append("hasVariants", String(data.hasVariants));
      const specsToSend = prepareSpecs(payload.specs);
      // Specs (JSON)
      // Cần hàm prepareSpecs giống ProductCreate
      fd.append("specs", JSON.stringify(specsToSend));
      if (payload.thumbnail instanceof File) {
        fd.append("thumbnail", payload.thumbnail);
      }
      if (payload.gallery && payload.gallery.length > 0) {
        payload.gallery.forEach(file => {
          fd.append("newGalleryImages", file);
        });
      }
      const productGalleryUrl = productData?.gallery
      const keptGalleryImageUrl = new Set((data.gallery ?? [])
        .filter(x => typeof x == "string"))
      const keptGalleryImageIds = productGalleryUrl?.filter(
        gl => keptGalleryImageUrl.has(gl.imageUrl)
      ).map(gl => gl.imagePublicId)
      keptGalleryImageIds?.forEach(id => {
        fd.append("keptGalleryImageIds", id);
      });
      payload.attributes.forEach((at, index) => {
        fd.append(`attributes[${index}].id`, at.id)
        fd.append(`attributes[${index}].label`, at.name)
        at.values.forEach((a, indexA) => {
          fd.append(`attributes[${index}].values[${indexA}].id`, a.id)
          fd.append(`attributes[${index}].values[${indexA}].value`, a.value)
          fd.append(`attributes[${index}].values[${indexA}].active`, JSON.stringify(a.active))
        })
      })

      payload.skus.forEach((sku, index) => {
        fd.append(`skus[${index}].id`, sku.id);
        fd.append(`skus[${index}].code`, sku.skuCode);
        fd.append(`skus[${index}].name`, sku.name);
        fd.append(`skus[${index}].price`, String(sku.price));
        fd.append(`skus[${index}].costPrice`, String(sku.costPrice));
        fd.append(`skus[${index}].active`, String(sku.active));
        fd.append(`skus[${index}].originalPrice`, String(sku.originalPrice));
        sku.attributes.forEach((op, indexOp) => {
          fd.append(`skus[${index}].specs[${indexOp}].id`, String(op.id))
          fd.append(`skus[${index}].specs[${indexOp}].groupId`, String(op.groupId))
        })
        if (sku.image) {
          fd.append(`skus[${index}].image`, sku.image);
        }
      })


      // SKUs
      // Lưu ý: Logic update SKU thường phức tạp (thêm/sửa/xóa). 
      // Ở đây giả định gửi đè toàn bộ hoặc backend handle theo skuCode/id.

      setIsLoadingTimeOut(true)
      await updateProduct({ id, idemKey: idemKey, body: fd }).unwrap();
      toast.success("Cập nhật sản phẩm thành công");
      setTimeout(() => {
        navigate("/products", { replace: true })
        setIsLoadingTimeOut(false)
      }, 1200);
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Lỗi cập nhật sản phẩm");
    }
  };
  const isDisablePage = isFetching || isUpdating || isLoadingTimeOut
  if (isFetching) return <div className="text-center p-5">Đang tải dữ liệu...</div>;

  return (
    <div className="d-flex align-items-center justify-content-center">
      <div className="border-app--rounded bg-white m-4 py-4" style={{ width: "1000px" }}>
        <div className="d-flex align-items-center justify-content-between border-bottom px-4 pb-4">
          <div>
            <div className="fw-bold fs-6">Cập nhật sản phẩm</div>
            <div className="f-caption">Chỉnh sửa thông tin chi tiết của sản phẩm.</div>
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
              form="product-edit-form"
              className="btn-app btn-app--sm d-flex align-items-center gap-2"
              disabled={isDisablePage}
            >
              <RiSaveLine />
              {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        <FormProvider {...methods}>
          <form id="product-edit-form" className="form-app pt-4" onSubmit={handleSubmit(onSubmit)}>
            <fieldset disabled={isDisablePage}>
              <Tabs forceRenderTabPanel>
                <TabList className="px-4 tablist">
                  <Tab><div><BsBox /> <span>Thông tin chung</span></div></Tab>
                  <Tab><div><IoSettingsOutline /> <span>Thông số kỹ thuật</span></div></Tab>
                  {hasVariants && (
                    <Tab><div><GoStack /> <span>Phân loại & Biến thể</span></div></Tab>
                  )}
                  <Tab><div><TbNotes /> <span>Mô tả</span></div></Tab>
                </TabList>

                <TabPanel><GeneralTabs updating={isDisablePage} /></TabPanel>
                <TabPanel><AttributeTabs updating={isDisablePage} /></TabPanel>
                {hasVariants && (
                  <TabPanel><SKUTabs mode="edit" /></TabPanel>
                )}
                <TabPanel><DescriptionTabs updating={isDisablePage} /></TabPanel>
              </Tabs>
            </fieldset>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ProductEdit;