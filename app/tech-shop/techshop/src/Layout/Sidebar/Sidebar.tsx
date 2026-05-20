import { NavLink } from "react-router";
import Logo from "../../assets/images/Logo.png"

const Sidebar = () => {
    const linkClass = ({isActive}: {isActive: boolean}) => 
        `dash-nav-item ${isActive ? "is-active" : ""}`;
  return (
    <div className="p-3 sidebar">
      <div className="d-flex align-items-center gap-2 mb-5">
        <img src={Logo} alt="logo" className="logo" style={{ width: 40, height: 40, borderRadius: 14}} />
        <div>
          <div className="fw-semibold">Ecommerce</div>
          <div className="text-muted small">Admin</div>
        </div>
      </div>

      <nav className="dash-nav">
        <NavLink to="/dashboard" className={linkClass}>
          Tổng quan
        </NavLink>
        <NavLink to="/users" className={linkClass}>
          Quản lý người dùng
        </NavLink>
        <NavLink to="/roles" className={linkClass}>
          Quản lí vai trò
        </NavLink>
        <NavLink to="/functions" className={linkClass}>
          Quản lí chức năng
        </NavLink>
        <NavLink to="/subfunctions" className={linkClass}>
          Quản lí quyền hạn
        </NavLink>
        <NavLink to="/categories" className={linkClass}>
          Quản lí danh mục
        </NavLink>
        <NavLink to="/brands" className={linkClass}>
          Quản lí Thương hiệu
        </NavLink>
        <NavLink to="/products" className={linkClass}>
          Quản lí sản phẩm
        </NavLink>
        <NavLink to="/attributes" className={linkClass}>
          Quản lí thuộc tính
        </NavLink>
        <NavLink to="/orders" className={linkClass}>
          Quản lí đơn hàng
        </NavLink>
        <NavLink to="/inventories" className={linkClass}>
          Quản lí tồn kho
        </NavLink>
        <NavLink to="/reviews" className={linkClass}>
          Quản lí phản hồi
        </NavLink>
      </nav>
    </div>
  )
}

export default Sidebar