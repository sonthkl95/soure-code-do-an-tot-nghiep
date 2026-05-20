import React, { useEffect, useState } from 'react'
import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import type { BrandCreateFormUI, StatusKey } from '../../types/brand.type'
import { useCreateBrandMutation } from '../../features/brand/brand.api'
import { toast } from 'react-toastify'
import { RiSave3Line } from 'react-icons/ri'
import { useNavigate } from 'react-router'
import UploadImageBox from '../../components/common/UploadImageBox'
import { CiSearch } from 'react-icons/ci'
import { useGetLeafCategoryQuery } from '../../features/category/category.api'
import type { CategoryOption } from '../../types/category.type'
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi'
import { FiUpload } from 'react-icons/fi'
import { slugify } from '../../utils/string'

const optionsStatus: Record<StatusKey, {
  content: string;
  class: string;
  icon: React.ReactNode;
}> = {
  active: {
    content: "Đang hoạt động",
    class: "status--active",
    icon: <PiEyeLight />,
  },
  hidden: {
    content: "Vô hiệu hóa",
    class: "status--inactive",
    icon: <PiEyeSlash />,
  },
};

const BrandCreate = () => {
  const navigate = useNavigate();

  const { register, control, formState: { errors }, handleSubmit, setValue, watch }
    = useForm<BrandCreateFormUI>({
      defaultValues: {
        name: "",
        slug: "",
        status: "active",
        description: "",
        logo: null,
        categories: []
      }
    })
  const dataCategories = watch("categories");
  const status: StatusKey = watch("status");
  const { data: categoryOptions, isLoading: isCategoryLoading } = useGetLeafCategoryQuery(null);
  const [createBrand, { isLoading: isCreating }] = useCreateBrandMutation();
  const onSubmit: SubmitHandler<BrandCreateFormUI> = async (data: BrandCreateFormUI) => {

    try {
      const fd = new FormData();
      fd.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }))
      fd.append("logo", data.logo ?? "")
      const res = await createBrand(fd).unwrap()
      toast.success(res?.message ?? "Tạo danh mục thành công");
      setTimeout(() => navigate("/brands", { replace: true }), 1200);
    } catch (error: any) {
      toast.error(error?.data?.message ?? "Có lỗi xảy ra")
    }
  }
  const [keyword, setKeyword] = useState("")
  const [options, setOptions] = useState<CategoryOption[]>([])
  useEffect(() => {
    if (!categoryOptions) return;

    setOptions(categoryOptions)
  }, [categoryOptions])
  const [slugAuto, setSlugAuto] = useState(true);

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
  const handelChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
    if (categoryOptions) {
      const filtered = categoryOptions.filter((item) =>
        item.name.toLowerCase().includes(e.target.value.toLowerCase()))
      setOptions(filtered);
    }
  }
  return (
    <div className='d-flex justify-content-center mt-5'>
      <div className="border-app--rounded bg-white" style={{ width: "900px" }}>
        <div className='d-flex align-items-center justify-content-between py-3 px-4 my-2 border-bottom'>
          <div>
            <div className="fw-bold fs-6">Tạo thuộc tính mới</div>
            <div className="f-body-3xs">Định nghĩa trường dữ liệu kỹ thuật cho sản phẩm.</div>
          </div>
          <div className='d-flex align-items-center gap-2'>
            <button onClick={() => navigate(-1)} className='btn-app btn-app--sm btn-app--ghost' >Hủy</button>
            <button type='submit' disabled={isCreating} form='brand-form' className='btn-app btn-app btn-app--sm btn-app--default'>
              <RiSave3Line />
              <span>Lưu</span>
            </button>
          </div>
        </div>
        <form id='brand-form' onSubmit={handleSubmit(onSubmit)} className='py-3 px-4 mb-5'>
          <fieldset disabled={isCreating || isCategoryLoading}>
            <div className='row form-app flex-row gap-0 gy-4'>
              <div className='col-6'>
                <div>
                  <label className="form-label" htmlFor="name">Tên hiển thị: <span className="text-danger">*</span></label>
                  <input {...register("name", {
                    required: {
                      value: true,
                      message: "Tên hiển thị được để trống."
                    }
                  })} disabled={isCreating} type="text" id='name' className='form-control form-control-sm' placeholder='e.g. Apple' />
                  {errors.name && <span className='form-message-error'>{errors.name?.message}</span>}
                </div>
                <div className='mb-3'>
                  <label className="form-label" htmlFor="slug">Slug: <span className="text-danger">*</span></label>
                  <input {...register("slug", {
                    required: {
                      value: true,
                      message: "Slug được để trống."
                    },
                    onChange: () => {
                      setSlugAuto(false)
                    }
                  })} disabled={isCreating} type="text" id='slug' className='form-control form-control-sm' placeholder='e.g. Apple' />
                  {errors.slug && <span className='form-message-error'>{errors.slug?.message}</span>}
                </div>
                <div className='mb-3'>
                  <Controller
                    control={control}
                    name='logo'
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
                <div>
                  <label className="form-label" htmlFor="description">Mô tả: <span className="text-danger">*</span></label>
                  <textarea {...register("description", {
                    required: {
                      value: true,
                      message: "Mô tả được để trống."
                    }
                  })} disabled={isCreating} id='description' className='form-control form-control-sm' placeholder='Thông tin mô tả' />
                  {errors.description && <span className='form-message-error'>{errors.description?.message}</span>}
                </div>
                <div className='mt-3'>
                  {
                    status && (
                      <button type='button' onClick={() => setValue("status", status == "active" ? "hidden" : "active")} className={`status status__icon status--lg ${optionsStatus[status].class}`}>
                        <span className='f-title'>
                          {optionsStatus[status].icon}
                        </span>
                        <span>
                          {optionsStatus[status].content}
                        </span>
                      </button>

                    )
                  }
                </div>
              </div>
              <div className='col-6'>
                <div>
                  <div className='f-body-sm fw-bold'>Ngành hàng liên quan</div>
                  <div className='f-caption'>Chọn các danh mục mà thương hiệu này cung cấp sản phẩm.</div>
                </div>
                <div className='rounded border overflow-hidden'>
                  <div className='bg-neutral-100 p-3 border-bottom'>
                    <div className='input-search'>
                      <input type="text" value={keyword} onChange={handelChangeSearch} className='form-control' placeholder='Tìm danh mục ' />
                      <div className='icon-search'>
                        <CiSearch />
                      </div>
                    </div>
                  </div>
                  <div className=' overflow-y-auto d-flex flex-column gap-2 p-3' style={{ height: 300 }}>
                    {options?.map(ct => (
                      <label key={ct.id} className={`d-flex align-items-center justify-content-start gap-2 p-3 btn-app btn-app--ghost border-0 ${dataCategories.includes(ct.id) ? "bg-neutral-100" : ""}`}>
                        <input type="checkbox" value={ct.id} {...register("categories", {
                          validate: (value) =>
                            value.length > 0 || "Vui lòng chọn ít nhất 1 danh mục",
                        })} />
                        <span>{ct.name}</span>
                      </label>
                    ))}
                    {errors.categories && (
                      <p className="form-message-error">
                        {errors.categories.message}
                      </p>
                    )}
                  </div>
                  <div className='bg-neutral-100 p-3 d-flex align-items-center justify-content-end'>
                    <span className='f-caption'>{dataCategories ? dataCategories.length : 0} danh mục đã chọn</span>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  )
}

export default BrandCreate