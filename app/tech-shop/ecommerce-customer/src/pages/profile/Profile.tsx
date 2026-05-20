import { NavLink, Outlet, useNavigate } from 'react-router';
import 'react-tabs/style/react-tabs.css'; // CSS mặc định của react-tabs

// React Bootstrap Components
import { Container, Row, Col, Card, Image, ListGroup } from 'react-bootstrap';

// Icons
import {
  RiUserLine, RiWallet3Line, RiFileList3Line, RiMapPinLine,
  RiNotification3Line, RiLogoutBoxRLine,
} from "react-icons/ri";

// API & Custom Components
import { useGetMyProfileQuery } from '../../features/profile/profile.api'; // Sửa lại path cho đúng
import "./profile.scss"; // CSS tùy chỉnh thêm (nếu cần)
import { useAppDispatch } from '../../store/hook';
import { logout } from '../../features/auth/auth.slice';


const Profile = () => {
  const { data: user, isLoading } = useGetMyProfileQuery();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "http://localhost:8081/logout";
    document.body.appendChild(form);
    form.submit();
    dispatch(logout())

    navigate("/");
  };



  if (isLoading) return <div className="text-center py-5">Đang tải dữ liệu...</div>;

  return (
    <Container className="py-5 profile-page">
      <Row className="g-4">
        {/* --- LEFT SIDEBAR --- */}
        <Col lg={3} md={4}>
          <Card className="border-0 shadow-sm mb-4 text-center bg-white">
            <Card.Body>
              <Image
                src={user?.avatarUrl || "https://i.pravatar.cc/150?img=12"}
                roundedCircle
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
              <h6 className="fw-bold mt-2 mb-0">{user?.firstName} {user?.lastName}</h6>
              <small className="text-muted">{user?.email}</small>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm overflow-hidden profile-sidebar">
            <ListGroup variant="flush">
              {/* Sử dụng NavLink để tự động thêm class "active" */}
              <NavLink to="account" className={({ isActive }) => `list-group-item list-group-item-action border-0 py-3 ps-4 d-flex align-items-center ${isActive ? 'active-sidebar' : ''}`}>
                <RiUserLine className="me-3" size={20} /> Hồ Sơ Của Tôi
              </NavLink>

              {/* Ví chuyển trang hoàn toàn nên dùng thẻ a hoặc Link thông thường */}
              <NavLink to="/my-wallet" className="list-group-item list-group-item-action border-0 py-3 ps-4 d-flex align-items-center">
                <RiWallet3Line className="me-3" size={20} /> Ví TechZone
              </NavLink>

              <NavLink to="orders" className={({ isActive }) => `list-group-item list-group-item-action border-0 py-3 ps-4 d-flex align-items-center ${isActive ? 'active-sidebar' : ''}`}>
                <RiFileList3Line className="me-3" size={20} /> Lịch Sử Đơn Hàng
              </NavLink>

              <NavLink to="address" className={({ isActive }) => `list-group-item list-group-item-action border-0 py-3 ps-4 d-flex align-items-center ${isActive ? 'active-sidebar' : ''}`}>
                <RiMapPinLine className="me-3" size={20} /> Sổ Địa Chỉ
              </NavLink>

              {/* <NavLink to="notifications" className={({isActive}) => `list-group-item list-group-item-action border-0 py-3 ps-4 d-flex align-items-center ${isActive ? 'active-sidebar' : ''}`}>
                <RiNotification3Line className="me-3" size={20} /> Thông Báo
              </NavLink> */}

              <button onClick={handleLogout} className="list-group-item list-group-item-action border-0 py-3 ps-4 text-danger cursor-pointer d-flex align-items-center" >
                <RiLogoutBoxRLine className="me-3" size={20} /> Đăng Xuất
              </button>
            </ListGroup>
          </Card>
        </Col>

        {/* --- RIGHT CONTENT --- */}
        <Col lg={9} md={8}>
          <Outlet /> {/* <--- Nơi hiển thị các component con như MyAccount, AddressBook... */}
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;