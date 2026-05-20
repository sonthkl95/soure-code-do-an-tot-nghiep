import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Modal, Button, Form, Spinner, Badge } from "react-bootstrap";
import {
  FiPlus, FiHome, FiBriefcase, FiEdit2, FiTrash2, FiMapPin, FiX, FiCheck,
} from "react-icons/fi";
import { toast } from "react-toastify";

// Import API hooks (Giả định path của bạn)
import {
  useGetProvincesQuery,
  useLazyGetDistrictsQuery,
  useLazyGetWardsQuery,
  useGetMyAddressesQuery,
  useCreateUserAddressMutation,
  useUpdateUserAddressMutation,
  useDeleteUserAddressMutation,
  useSetDefaultAddressMutation,
} from "../../features/address/address.api";

import "./adress.scss";
import type { IUserAddressRequest } from "../../types/location.type";

export default function AddressBook() {
  // ---- 1. API QUERIES & MUTATIONS ----
  const { data: addresses = [], isLoading: isListLoading } = useGetMyAddressesQuery();
  const { data: provinces = [] } = useGetProvincesQuery();

  const [triggerDistricts, { data: districts = [] }] = useLazyGetDistrictsQuery();
  const [triggerWards, { data: wards = [] }] = useLazyGetWardsQuery();

  const [createAddress] = useCreateUserAddressMutation();
  const [updateAddress] = useUpdateUserAddressMutation();
  const [deleteAddress] = useDeleteUserAddressMutation();
  const [setDefault] = useSetDefaultAddressMutation();

  // ---- 2. UI STATE ----
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("create");
  const [saving, setSaving] = useState(false);

  // ---- 3. REACT HOOK FORM SETUP ----
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IUserAddressRequest>({
    defaultValues: {
      type: "HOME",
      isDefault: false,
    },
  });

  // Watch các giá trị để hiển thị Preview và xử lý logic
  const watchAllFields = watch();

  // ---- 4. LOGIC HANDLERS ----

  const openCreate = () => {
    setMode("create");
    reset({
      receiverName: "",
      phone: "",
      provinceCode: "",
      districtCode: "",
      wardCode: "",
      detailAddress: "",
      isDefault: addresses.length === 0,
      type: "HOME",
    });
    setShow(true);
  };

  const openEdit = async (addr) => {
    setMode("edit");
    reset(addr);
    // Kích hoạt load data cho các select phụ thuộc
    if (addr.provinceCode) triggerDistricts(addr.provinceCode);
    if (addr.districtCode) triggerWards(addr.districtCode);
    setShow(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShow(false);
  };

  // Xử lý Cascading Select (Tỉnh -> Huyện) - KHÔNG dùng useEffect
  const handleProvinceChange = (e) => {
    const code = e.target.value;
    setValue("provinceCode", code);
    setValue("districtCode", ""); // Reset cấp dưới
    setValue("wardCode", "");
    if (code) triggerDistricts(code);
  };

  // Xử lý Cascading Select (Huyện -> Xã)
  const handleDistrictChange = (e) => {
    const code = e.target.value;
    setValue("districtCode", code);
    setValue("wardCode", ""); // Reset cấp dưới
    if (code) triggerWards(code);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (mode === "create") {
        await createAddress(data).unwrap();
        toast.success("Thêm địa chỉ thành công!");
      } else {
        await updateAddress(data).unwrap();
        toast.success("Cập nhật địa chỉ thành công!");
      }
      closeModal();
    } catch (err) {
      toast.error("Thao tác thất bại, vui lòng kiểm tra lại.");
    } finally {
      setSaving(false);
    }
  };

  const getName = (list, code) => list?.find((x) => x.code === code)?.name || "";

  if (isListLoading) return <div className="p-5 text-center"><Spinner animation="border" variant="danger" /></div>;

  return (
    <div className="address-page container py-4">
      {/* Header Section */}
      <div className="address-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="address-title">Sổ Địa Chỉ</h1>
          <p className="address-subtitle">Quản lý danh sách địa chỉ nhận hàng của bạn</p>
        </div>
        <Button className="btn-add" onClick={openCreate}>
          <FiPlus /> Thêm Địa Chỉ Mới
        </Button>
      </div>

      {/* Address Grid */}
      <div className="row g-4">
        {addresses.map((addr) => (
          <div className="col-12 col-lg-6" key={addr.id}>
            <div className={`addr-card ${addr.isDefault ? "is-default" : ""}`}>
              <div className="addr-card__top">
                <div className="addr-card__left">
                  <div className="addr-icon">
                    {addr.type === "WORK" ? <FiBriefcase /> : <FiHome />}
                  </div>
                  <div className="addr-meta">
                    <div className="addr-meta__title-row">
                      <span className="addr-meta__title">
                        {addr.type === "WORK" ? "Văn Phòng" : "Nhà Riêng"}
                      </span>
                      {addr.isDefault && <span className="addr-badge-default">MẶC ĐỊNH</span>}
                    </div>
                  </div>
                </div>
                <div className="addr-actions">
                  <button className="icon-btn" onClick={() => openEdit(addr)}><FiEdit2 /></button>
                  <button className="icon-btn" onClick={() => {
                    if (window.confirm("Xóa địa chỉ này?")) deleteAddress(addr.id);
                  }}><FiTrash2 /></button>
                </div>
              </div>

              <div className="addr-card__body">
                <div className="addr-name">{addr.receiverName}</div>
                <div className="addr-line">{addr.detailAddress}</div>
                <div className="addr-line">{addr.wardName}, {addr.districtName}, {addr.provinceName}</div>
                <div className="addr-phone">
                  <span className="addr-phone__label">SĐT:</span> {addr.phone}
                </div>
                {!addr.isDefault && (
                  <button className="addr-make-default" onClick={() => setDefault(addr.id)}>
                    Đặt làm mặc định
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add New Card (Dashed) */}
        <div className="col-12 col-lg-6">
          <div className="addr-add-card" onClick={openCreate}>
            <div className="addr-add-card__inner">
              <div className="addr-add-card__plus"><FiPlus /></div>
              <div className="addr-add-card__text">Thêm Địa Chỉ Mới</div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Modal show={show} onHide={closeModal} centered size="lg" backdrop="static" dialogClassName="addr-modal">
        <Modal.Header className="addr-modal__header" closeButton={!saving}>
          <div className="addr-modal__header-left">
            <div className="addr-modal__icon"><FiMapPin /></div>
            <div className="addr-modal__titles">
              <div className="addr-modal__title">{mode === "create" ? "Thêm địa chỉ mới" : "Chỉnh sửa địa chỉ"}</div>
              <div className="addr-modal__subtitle">Vui lòng điền chính xác thông tin để đảm bảo giao hàng</div>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="addr-modal__body">
          <Form className="form-app" onSubmit={handleSubmit(onSubmit)}>
            {/* Type & Default Row */}
            <div className="type-row mb-4">
              <div className={`type-btn ${watchAllFields.type === "HOME" ? "active" : ""}`}
                onClick={() => setValue("type", "HOME")}>
                <span className="type-pill home"><FiHome /> Nhà Riêng</span>
              </div>
              <div className={`type-btn ${watchAllFields.type === "WORK" ? "active" : ""}`}
                onClick={() => setValue("type", "WORK")}>
                <span className="type-pill work"><FiBriefcase /> Văn Phòng</span>
              </div>
              <div className="ms-auto default-check">
                <Form.Check 
                  type="checkbox" 
                  id="isDefault" 
                  label="Đặt làm địa chỉ mặc định" 
                  {...register("isDefault")}
                />
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label>Tên người nhận</Form.Label>
                <Form.Control 
                  className={errors.receiverName ? "is-invalid" : ""}
                  placeholder="Nhập họ và tên"
                  {...register("receiverName", { required: "Vui lòng nhập tên" })}
                />
                {errors.receiverName && <div className="form-message-error">{errors.receiverName.message}</div>}
              </div>

              <div className="col-md-6">
                <Form.Label>Số điện thoại</Form.Label>
                <Form.Control 
                  className={errors.phone ? "is-invalid" : ""}
                  placeholder="Số điện thoại liên lạc"
                  {...register("phone", { required: "Vui lòng nhập SĐT", pattern: { value: /^[0-9]+$/, message: "SĐT không hợp lệ" } })}
                />
                {errors.phone && <div className="form-message-error">{errors.phone.message}</div>}
              </div>

              <div className="col-md-4">
                <Form.Label>Tỉnh / Thành phố</Form.Label>
                <Form.Select 
                  className={errors.provinceCode ? "is-invalid" : ""}
                  {...register("provinceCode", { required: "Vui lòng chọn Tỉnh" })}
                  onChange={handleProvinceChange}
                >
                  <option value="">Chọn Tỉnh/Thành</option>
                  {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                </Form.Select>
              </div>

              <div className="col-md-4">
                <Form.Label>Quận / Huyện</Form.Label>
                <Form.Select 
                  className={errors.districtCode ? "is-invalid" : ""}
                  disabled={!watchAllFields.provinceCode}
                  {...register("districtCode", { required: "Vui lòng chọn Quận" })}
                  onChange={handleDistrictChange}
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                </Form.Select>
              </div>

              <div className="col-md-4">
                <Form.Label>Phường / Xã</Form.Label>
                <Form.Select 
                  className={errors.wardCode ? "is-invalid" : ""}
                  disabled={!watchAllFields.districtCode}
                  {...register("wardCode", { required: "Vui lòng chọn Xã" })}
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                </Form.Select>
              </div>

              <div className="col-12">
                <Form.Label>Địa chỉ chi tiết</Form.Label>
                <Form.Control 
                  as="textarea" 
                  className={errors.detailAddress ? "is-invalid" : ""}
                  placeholder="Số nhà, tên tòa nhà, tên đường..."
                  {...register("detailAddress", { required: "Vui lòng nhập địa chỉ chi tiết" })}
                />
                <div className="hint mt-2">Ví dụ: 25 Lạc Long Quân, Phường 3...</div>
              </div>

              {/* Real-time Preview */}
              <div className="col-12">
                <div className="preview-box">
                  <div className="preview-title">XEM TRƯỚC ĐỊA CHỈ</div>
                  <div className="preview-line">
                    <strong>{watchAllFields.receiverName || "(Tên người nhận)"}</strong> • {watchAllFields.phone || "(SĐT)"}
                  </div>
                  <div className="preview-line">
                    {watchAllFields.detailAddress || "(Địa chỉ chi tiết)"}
                  </div>
                  <div className="preview-line text-muted">
                    {getName(wards, watchAllFields.wardCode) || "Xã"} 
                    {`, ${getName(districts, watchAllFields.districtCode) || "Huyện"}`} 
                    {`, ${getName(provinces, watchAllFields.provinceCode) || "Tỉnh"}`}
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer className="addr-modal__footer">
          <Button variant="light" className="btn-cancel btn-app btn-app--ghost rounded" onClick={closeModal} disabled={saving}>Hủy bỏ</Button>
          <Button className="btn-add btn-app rounded" onClick={handleSubmit(onSubmit)} disabled={saving}>
            {saving ? <Spinner size="sm" className="me-2" /> : <FiCheck className="me-2" />}
            {mode === "create" ? "Xác nhận thêm" : "Lưu thay đổi"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}