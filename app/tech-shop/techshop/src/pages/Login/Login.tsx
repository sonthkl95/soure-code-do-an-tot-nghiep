import Logo from "../../assets/images/Logo.png"
import "./login.scss"
const Login = () => {
  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <img src={Logo} className="login-logo" />
          <div>
            <div className="login-title">Bảng điều khiên</div>
            <div className="login-subtitle">Đăng nhập để tiếp tục.</div>
          </div>
        </div>

        {/* Content */}
        <div className="login-content">
          <p className="login-desc">
            Trang quản trị này bị hạn chế. Vui lòng đăng nhập bằng tài khoản tổ chức của bạn để tiếp tục.
          </p>

          <a href="http://localhost:8088/oauth2/authorization/admin-idp" className="btn-app btn-app--default w-100 login-btn">
            Đăng nhập với SSO
          </a>
        </div>

        {/* Footer */}
        <div className="login-footer">
          <span>© {new Date().getFullYear()} Ecommerce Platform</span>
        </div>
      </div>
    </div>
  )
}

export default Login