import React, { useEffect, useState } from 'react';
import { useGetProfileQuery, useUpdateProfileMutation } from '../../features/user/user.api';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

interface ProfileInputs {
    firstName: string;
    lastName: string;
    phone: string;
}

const ProfilePage = () => {
    const [isEditing, setIsEditing] = useState(false);

    // 1. Hook lấy dữ liệu và Mutation cập nhật
    const { data: profile, isLoading } = useGetProfileQuery();
    const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

    // 2. Khởi tạo React Hook Form
    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileInputs>();

    // 3. Đổ dữ liệu từ API vào Form khi load xong
    useEffect(() => {
        if (profile) {
            reset({
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone || ""
            });
        }
    }, [profile, reset]);

    // 4. Hàm xử lý khi nhấn Lưu
    const onSubmit = async (data: ProfileInputs) => {
        try {
            await updateProfile(data).unwrap();
            toast.success("Cập nhật hồ sơ thành công!");
            setIsEditing(false);
        } catch (err) {
            toast.error("Lỗi cập nhật thông tin");
        }
    };

    if (isLoading) return <div className="p-5 text-center">Đang tải dữ liệu...</div>;

    return (
        <div className="container py-5" style={{ maxWidth: '800px' }}>
            <form onSubmit={handleSubmit(onSubmit)} className="card border-0 shadow-sm rounded-4 p-4 p-md-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold mb-0">Hồ sơ của tôi</h5>
                    {!isEditing ? (
                        <button
                            type="button"
                            className="btn-app btn-app--ghost px-3 rounded-pill"
                            onClick={() => setIsEditing(true)}
                        >
                            Chỉnh sửa
                        </button>
                    ) : (
                        <div className="d-flex gap-2">
                            <button
                                type="submit"
                                className="btn-app px-4 rounded-pill"
                                disabled={isUpdating}
                            >
                                {isUpdating ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                                type="button"
                                className="btn-app btn-app--outline px-3 rounded-pill"
                                onClick={() => {
                                    setIsEditing(false);
                                    reset(); // Khôi phục lại dữ liệu cũ
                                }}
                            >
                                Hủy
                            </button>
                        </div>
                    )}
                </div>

                <div className="row g-4 form-app flex-row gap-0">
                    {/* Họ */}
                    <div className="col-md-6">
                        <label htmlFor='firstName' className="form-label small fw-bold text-muted">Họ</label>
                        <input
                            id='firstName'
                            {...register("firstName", { required: "Họ không được để trống" })}
                            className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                            disabled={!isEditing}
                        />
                        {errors.firstName && <div className="invalid-feedback">{errors.firstName.message}</div>}
                    </div>

                    {/* Tên */}
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-muted">Tên</label>
                        <input
                            {...register("lastName", { required: "Tên không được để trống" })}
                            className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                            disabled={!isEditing}
                        />
                        {errors.lastName && <div className="invalid-feedback">{errors.lastName.message}</div>}
                    </div>

                    {/* Email (Chỉ xem) */}
                    <div className="col-12">
                        <label className="form-label small fw-bold text-muted">Email</label>
                        <input className="form-control bg-light" value={profile?.email} disabled />
                    </div>

                    {/* Số điện thoại */}
                    <div className="col-12">
                        <label className="form-label small fw-bold text-muted">Số điện thoại</label>
                        <input
                            {...register("phone", {
                                pattern: {
                                    value: /^[0-9]{10}$/,
                                    message: "Số điện thoại phải có 10 chữ số"
                                }
                            })}
                            className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                            placeholder="Chưa có số điện thoại"
                            disabled={!isEditing}
                        />
                        {errors.phone && <div className="invalid-feedback">{errors.phone.message}</div>}
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProfilePage;