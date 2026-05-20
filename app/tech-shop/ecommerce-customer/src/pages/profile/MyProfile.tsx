import React, { useState } from 'react'
import { Badge, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { RiPencilFill, RiShieldCheckLine } from 'react-icons/ri'
import EditProfileModal from './EditProfileModal'
import { useGetMyProfileQuery } from '../../features/profile/profile.api'

const MyProfile = () => {
    const { data: user, isLoading } = useGetMyProfileQuery();

    const [showEditModal, setShowEditModal] = useState(false);
    return (
        <div>
            <Card className="border-0 shadow-sm">
                <Card.Body className="p-4 bg-white rounded-4">

                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                        <div>
                            <h5 className="fw-bold mb-1">Hồ Sơ Của Tôi</h5>
                            <small className="text-muted">Quản lý thông tin hồ sơ để bảo mật tài khoản</small>
                        </div>
                        <Button variant="outline-danger" size="sm" onClick={() => setShowEditModal(true)}>
                            <RiPencilFill className="me-1" /> Chỉnh Sửa
                        </Button>
                    </div>

                    {/* Form Hiển Thị (Read Only) */}
                    <Form>
                        <Row className="mb-3">
                            <Form.Label column sm="3" className="text-muted fw-bold small">
                                HỌ VÀ TÊN
                            </Form.Label>
                            <Col sm="9">
                                <Form.Control plaintext readOnly defaultValue={user?.firstName + " " + String(user?.lastName)} className="fw-bold text-dark" />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Form.Label column sm="3" className="text-muted fw-bold small">
                                EMAIL
                            </Form.Label>
                            <Col sm="9" className="d-flex align-items-center">
                                <Form.Control plaintext readOnly defaultValue={user?.email} className="w-auto me-2" />
                                {/* Giả sử user có trường verifyEmail */}
                                <Badge bg="success" className="d-flex align-items-center">
                                    <RiShieldCheckLine className="me-1" /> Đã xác thực
                                </Badge>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Form.Label column sm="3" className="text-muted fw-bold small">
                                SỐ ĐIỆN THOẠI
                            </Form.Label>
                            <Col sm="9">
                                <Form.Control
                                    plaintext readOnly
                                    defaultValue={user?.phone || "Chưa cập nhật"}
                                    className={!user?.phone ? "text-muted fst-italic" : ""}
                                />
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Form.Label column sm="3" className="text-muted fw-bold small">
                                NGÀY THAM GIA
                            </Form.Label>
                            <Col sm="9">
                                <Form.Control plaintext readOnly defaultValue={user?.joinDate || "20/10/2025"} />
                            </Col>
                        </Row>
                    </Form>

                </Card.Body>
            </Card>
            <EditProfileModal
                show={showEditModal}
                onClose={() => setShowEditModal(false)}
                currentFirstName={user?.firstName || ""}
                currentLastName={user?.lastName || ""}
                currentAvatar={user?.avatarUrl || ""}
                currentPhone={user?.phone || ""}
            />
        </div>
    )
}

export default MyProfile