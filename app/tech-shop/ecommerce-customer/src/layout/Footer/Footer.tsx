import React from 'react'
import Logo from "../../assets/logo.png"
import { Link } from 'react-router'
import { RiFacebookFill, RiInstagramLine, RiMailLine, RiTwitterLine } from 'react-icons/ri'
const Footer = () => {
    return (
        <div className='footer pt-4 pb-5'>
            <div className='container'>
                <div className='top-footer d-md-flex gap-4 d-block pb-3'>
                    <div className='d-flex flex-column gap-3'>
                        <div className='d-flex align-items-center gap-1'>
                            <img src={Logo} alt="logo" />
                            <span className='fw-bold fs-6 text-white'>TechZone</span>
                        </div>
                        <div className='f-body-2xs text-wrap'>Điểm đến cuối cùng cho thiết bị chơi game, laptop hiệu năng cao và phụ kiện cao cấp. Nâng cấp trải nghiệm của bạn ngay hôm nay.</div>
                        <div className='d-flex align-items-center gap-2'>
                            <a href="https://www.facebook.com/khiem2k1/" className='btn-social'><RiFacebookFill size={16} /></a>
                            <Link to="/" className='btn-social'><RiTwitterLine  size={16}/></Link>
                            <a href="https://www.instagram.com/phamkhiem2712/" className='btn-social'><RiInstagramLine size={16} /></a>
                        </div>
                    </div>
                    <div>
                        <div className='text-uppercase f-medium f-body text-nowrap text-white'>Chăm Sóc Khách Hàng</div>
                        <div className='mt-3 d-flex flex-column gap-2'>
                            <Link to="/help-center">Trung tâm trợ giúp</Link>
                            <Link to="/profile/orders">Lịch sử đơn hàng</Link>
                            <Link to="/contact">Liên hệ</Link>
                        </div>
                    </div>
                    <div>
                        <div className='text-uppercase f-medium f-body text-nowrap text-white'>Về chúng tôi</div>
                        <div className='mt-3 d-flex flex-column gap-2'>
                            <Link to="/">Câu chuyện thương hiệu</Link>
                            <Link to="/privacy-policy">Chính sách bảo mật</Link>
                            <Link to="/stores">Hệ thống cửa hàng</Link>
                        </div>
                    </div>
                    <div>
                        <div className='text-uppercase f-medium f-body text-nowrap text-white'>Đăng Ký Nhận Tin</div>
                        <div className='mt-3 d-flex flex-column gap-2'>
                            <Link to="/" className='text-wrap'>Đăng ký để nhận ưu đãi độc quyền và tin tức công nghệ mới nhất.</Link>
                            <div className='d-flex flex-nowrap gap-2 input-mail'>
                                <input type="text" placeholder='Nhập email của bạn' className='flex-fill' /> <button><RiMailLine size={20} /></button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='d-flex flex-column flex-md-row align-items-center justify-content-between mt-3'>
                    <span className='f-body-2xs'>© 2024 TechZone Elite. Bảo lưu mọi quyền.</span>
                    <Link className='/terms' to="/">Điều khoản dịch vụ</Link>
                </div>
            </div>
        </div>
    )
}

export default Footer