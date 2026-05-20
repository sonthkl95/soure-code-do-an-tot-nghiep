import React from 'react'
import { useGetBrandByIdQuery } from '../../features/brand/brand.api'
import { useNavigate, useParams } from 'react-router'
import { PiEyeLight, PiEyeSlash } from 'react-icons/pi';
import { LuCalendarDays } from 'react-icons/lu';
import { GoTag } from 'react-icons/go';
import type { StatusKey } from '../../types/brand.type';


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
const BrandDetail = () => {
  const navigate = useNavigate()
  const { id: brandId } = useParams<{ id: string }>()
  const { data, isLoading } = useGetBrandByIdQuery(brandId as string, {
    skip: !brandId,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  return (
    <div className='border-app--rounded bg-white m-4 py-4'>
      <div className="d-flex align-items-center justify-content-between border-bottom px-4 pb-4">
        <div>
          <div className="fw-bold fs-6">Chi tiết thương hiệu</div>
          <div className="f-caption">Chi tiết thông tin thương hiệu.</div>
        </div>
        <button
          className="btn-app btn-app--ghost btn-app--sm"
          onClick={() => navigate(-1)}
          disabled={isLoading}
          type="button"
        >
          Hủy
        </button>
      </div>
      <div className='px-4 mt-4 row'>
        <div className='col-4'>
          <div className='border-app--rounded d-flex align-items-center flex-column px-3 py-4'>
            <img src={data?.logo?.imageUrl} style={{ width: 150, height: 150 }} alt="logo" />
            <span className='f-caption'>{`/${data?.slug}`}</span>
            <div className={`status status__icon status--sm mt-3 ${optionsStatus[data?.status ?? "active"].class}`}>
              <span className='f-title'>
                {optionsStatus[data?.status ?? "active"].icon}
              </span>
              <span>
                {optionsStatus[data?.status ?? "hidden"].content}
              </span>
            </div>
          </div>
          <div className='border-app--rounded bg-neutral-50 px-3 py-2 mt-3'>
            <div className='d-flex align-items-center gap-2'>
              <LuCalendarDays />
              <span className='fw-bold'>Thông tin hệ thống</span>
            </div>
            <div className='d-flex align-items-center justify-content-between f-caption'>
              <span>Ngày tạo:</span>
              <span>{data?.createdDate}</span>
            </div>
            <div className='d-flex align-items-center justify-content-between f-caption'>
              <span>Ngày cập nhật:</span>
              <span>{data?.updatedDate}</span>
            </div>
          </div>
        </div>
        <div className='col-8'>
          <div className='f-section'>Mô tả:</div>
          <div className='border-app--rounded bg-neutral-50 px-3 py-4'>{data?.description}</div>
          <div className='d-flex align-items-center justify-content-between mt-4'>
            <div className='d-flex align-items-center f-section gap-2'>
              <GoTag />
              <span>Ngành hàng liên quan</span>
            </div>
            <span className='status status--sm status--draft' >{`${data?.categories.length} danh mục`}</span>
          </div>
          <div className='row gx-3 mt-2'>
            {data?.categories?.map((item) => (
              <div key={item.id} className='col-4'>
                <div className='d-flex gap-2 align-items-center px-2 py-2 border-app--rounded'> 
                  <div className='p-2 bg-neutral-100 rounded'>
                    <GoTag />
                  </div>
                  <span className='f-meta fw-bold'>{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BrandDetail