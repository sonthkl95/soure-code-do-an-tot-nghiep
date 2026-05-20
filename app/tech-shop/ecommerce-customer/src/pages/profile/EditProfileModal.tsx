import React, { useEffect, useState, useRef } from 'react';
import { Modal, Button, Form, Image, Spinner } from 'react-bootstrap';
import { RiCameraFill, RiUser3Line, RiPhoneLine } from "react-icons/ri";
import { toast } from 'react-toastify';
import { useUpdateProfileMutation } from '../../features/profile/profile.api';
import { Controller, set, useForm, type SubmitHandler } from "react-hook-form"
import type { UpdateProfile } from '../../types/profile.type';


type Props = {
    show: boolean,
    onClose: () => void,
    currentFirstName: string,
    currentLastName: string,
    currentPhone: string,
    currentAvatar: string
}

const EditProfileModal = ({ show, onClose, currentFirstName, currentLastName, currentPhone, currentAvatar }: Props) => {
    // --- State Form ---

    const { handleSubmit, register, formState: { errors }, control } = useForm<UpdateProfile>({
        defaultValues: {
            firstName: currentFirstName,
            lastName: currentLastName,
            phone: currentPhone,
            avatar: null
        }
    })
    // --- State Avatar ---


    // --- API Hooks ---
    const [updateProfile, { isLoading: isUpdatingInfo }] = useUpdateProfileMutation();
    const [imagePreview, setImagePreview] = useState<string>(currentAvatar ?? "https://i.pravatar.cc/150?img=12")
    const onSubmit: SubmitHandler<UpdateProfile> = async (data) => {
        const fd = new FormData()
        fd.append("firstName", data.firstName);
        fd.append("lastName", data.lastName);
        fd.append("phone", data.phone);
        if (data.avatar) {
            fd.append("avatar", data.avatar); // ✅ File là Blob luôn
        }
        try {
            await updateProfile(fd).unwrap()
            toast.success("Cập nhật thành công");
        } catch (error) {
            console.log(error);
            toast.error("Cập nhật hồ sơ không thành công");

        }
    }

    // Xử lý Submit


    return (
        <Modal show={show} onHide={onClose} centered backdrop="static" keyboard={false}>
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold">Chỉnh Sửa Hồ Sơ</Modal.Title>
            </Modal.Header>

            <form onSubmit={handleSubmit(onSubmit)} id='profile-form'>
                <Modal.Body>
                    <div className='px-3 form-app'>
                        <Controller
                            control={control}
                            name='avatar'
                            rules={{
                                required: "Ảnh không được để trống"
                            }}
                            render={({ field, fieldState }) => (
                                <div className="d-flex flex-column align-items-center mb-4">
                                    <label
                                        className="position-relative cursor-pointer"
                                        style={{ width: '120px', height: '120px' }}
                                    >
                                        {/* Ảnh Preview */}
                                        <Image
                                            src={imagePreview}
                                            roundedCircle
                                            className="border border-3 border-light shadow-sm w-100 h-100"
                                            style={{ objectFit: 'cover' }}
                                        />

                                        {/* Overlay Icon Camera */}
                                        <div
                                            className="btn-avatar position-absolute top-0 start-0 w-100 h-100 rounded-circle d-flex align-items-center justify-content-center"
                                        >
                                            <RiCameraFill className="text-white" size={30} />
                                        </div>
                                        <input
                                            type="file"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                // tạo URL tạm để preview
                                                const previewUrl = URL.createObjectURL(file);
                                                setImagePreview(previewUrl);

                                                field.onChange(file);
                                            }}
                                            accept="image/*"
                                            hidden
                                        />
                                    </label>
                                    <span className="text-muted mt-2">
                                        Nhấn vào ảnh để thay đổi (Max 2MB)
                                    </span>
                                    {fieldState.error && <span className='f-caption text-danger'>{fieldState.error.message}</span>}
                                    {/* Input File Ẩn */}
                                </div>

                            )}

                        />
                        <div>
                            <label htmlFor="firstName" className='form-label'>Họ: <span className='text-danger'>*</span></label>
                            <input {...register("firstName", {
                                required: {
                                    value: true,
                                    message: "Họ không được để trống"
                                }
                            })} id='firstName' type="text" className='form-control form-control-sm' />
                            {errors.firstName && <span className='f-caption text-danger'>{errors.firstName.message}</span>}
                        </div>
                        <div>
                            <label htmlFor="lastName" className='form-label'>Tên: <span className='text-danger'>*</span></label>
                            <input {...register("lastName", {
                                required: {
                                    value: true,
                                    message: "Tên không được để trống"
                                }
                            })} id='lastName' type="text" className='form-control form-control-sm' />
                            {errors.lastName && <span className='f-caption text-danger'>{errors.lastName.message}</span>}

                        </div>
                        <div>
                            <label htmlFor="phone" className='form-label'>SDT: <span className='text-danger'>*</span></label>
                            <input {...register("phone", {
                                required: {
                                    value: true,
                                    message: "Số điện thoại không được để trống"
                                }
                            })} id='phone' type="text" className='form-control form-control-sm' />
                            {errors.phone && <span className='f-caption text-danger'>{errors.phone.message}</span>}

                        </div>

                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onClose} disabled={isUpdatingInfo}>
                        Hủy Bỏ
                    </Button>
                    <Button variant="danger" type="submit" form='profile-form' disabled={isUpdatingInfo}>
                        {isUpdatingInfo ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                Đang lưu...
                            </>
                        ) : (
                            'Lưu Thay Đổi'
                        )}
                    </Button>
                </Modal.Footer>
            </form>
        </Modal>
    );
};

export default EditProfileModal;