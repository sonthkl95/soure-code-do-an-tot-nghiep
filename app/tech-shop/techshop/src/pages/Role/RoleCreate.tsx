import React, { useMemo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { RiSave3Line } from 'react-icons/ri'
import AccordionSelect, { type Section } from '../../components/common/AccordionSelect'
import { useGetAllFunctionsQuery } from '../../features/functions/function.api'
import { toSection, type FunctionEntity } from '../../types/function.type'
import { Link, useNavigate } from 'react-router'
import { useCreateRoleMutation } from '../../features/roles/role.api'
import { toast } from 'react-toastify'

type RoleInput = {
  code: string,
  name: string,
  description: string
}
const RoleCreate = () => {
  const {
    data: functions,
    isLoading,
    isError,
    error
  } = useGetAllFunctionsQuery(null);
  // console.log(fucntions);

  const [selected, setSelected] = useState<string[]>([]);
  const {
    register,
    formState: { errors },
    handleSubmit

  } = useForm<RoleInput>();

  const sections: Section[] = useMemo(
    () => toSection(functions),
    [functions]
  )
  console.log(selected);
  const [disabledForm, setDisabledForm] = useState<boolean>(false)
  const navigate = useNavigate()
  const [createRole] = useCreateRoleMutation()
  const onSubmit: SubmitHandler<RoleInput> = async (data: RoleInput) => {
    const code = data.code.trim();
    const name = data.name.trim()
    const description = data.description.trim()
    try {
      setDisabledForm(true)
      console.log(code);
      
      const res = await createRole({ code, name, description, subFunctions: selected }).unwrap();
      toast.success(res.message)
      setTimeout(() => {
        navigate("/roles", { replace: true })
        setDisabledForm(false)
      }, 1500);
    } catch (error: any) {
      console.log(error);
      setDisabledForm(false)
      toast.error(error?.data?.message ?? "Có lỗi xảy ra");
    }

  };

  return (
    <div className='p-2 border-app--rounded bg-surface'>
      <div className='d-flex align-items-center justify-content-end my-2'>
        <div className='d-flex align-items-center gap-2'>
          <Link to="/roles" className='btn-app btn-app--sm btn-app--ghost' >Hủy</Link>
          <button type='submit' form='role-form' className='btn-app btn-app btn-app--sm btn-app--default'>
            <RiSave3Line />
            <span>Lưu</span>
          </button>
        </div>
      </div>
      <Row className='g-4'>
        <Col lg={4}>
          <form id="role-form" onSubmit={handleSubmit(onSubmit)} className='form-app p-2'>
            <div>
              <label htmlFor="code">Mã vai trò: <span className="text-danger">*</span></label>
              <input disabled={disabledForm} {...register("code", {
                required: {
                  value: true,
                  message: "Mã không được để trống."
                }
              })} type="text" id='code' className='form-control form-control-sm' placeholder='Ví dụ: ROLE_EXAMPLE' />
              {errors.code && <span className='form-message-error'>{errors.code?.message}</span>}
            </div>
            <div>
              <label htmlFor="name">Tên vai trò: <span className="text-danger">*</span></label>
              <input disabled={disabledForm} {...register("name", {
                required: {
                  value: true,
                  message: "Tên không được để trống."
                }
              })} type="text" id='name' className='form-control form-control-sm' placeholder='Ví dụ: Khách hàng...' />
              {errors.name && <span className='form-message-error'>{errors.name?.message}</span>}
            </div>
            <div>
              <label htmlFor="description">Mô tả: <span className="text-danger">*</span></label>
              <textarea disabled={disabledForm} {...register("description", {
                required: {
                  value: true,
                  message: "Mô tả không được để trống."
                }
              })} id='description' className='form-control' placeholder='Mô tả trách nhiệm...' />
              {errors.description && <span className='form-message-error'>{errors.description?.message}</span>}
            </div>
          </form>
          <div className='border-app--rounded  bg-neutral-100 p-2 m-2'>
            <div className='f-medium'>Tóm tắt</div>
            <div className='d-flex align-items-center justify-content-between'>
              <span className='f-body-2xs'>Chức năng đã chọn:</span>
              <span className='d-inline-block bg-white py-1 px-2 app-radius__sm f-body-xs' >{selected.length}</span>
            </div>
          </div>
        </Col>
        <Col>
          <div className='d-flex align-items-center justify-content-between'>
            <span className='f-section'>Cấu hình quyền</span>
            <span className='f-micro'>Chọn các chức năng mà vai trò này có thể truy cập.</span>
          </div>
          <div className='d-flex flex-column gap-2'>
            <AccordionSelect
              disabled={disabledForm}
              sections={sections}
              value={selected}
              selectedValue={[]}
              onChange={setSelected}
            />
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default RoleCreate