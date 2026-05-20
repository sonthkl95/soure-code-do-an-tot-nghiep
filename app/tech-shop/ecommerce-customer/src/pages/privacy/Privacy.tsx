import React from 'react'

const Privacy = () => {
    return (
        <div className="container py-5" style={{maxWidth: "800px"}}>
            <article className="bg-surface p-5 border-app--rounded shadow-sm">
                <h1 className="f-title mb-4">Chính sách bảo mật</h1>
                <section className="mb-4">
                    <h3 className="f-section">1. Thu thập thông tin</h3>
                    <p className="f-body-sm lh-relaxed">Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản, đặt hàng hoặc đăng ký nhận bản tin công nghệ. Thông tin bao gồm Email, Tên và Địa chỉ giao hàng.</p>
                </section>
                <section className="mb-4">
                    <h3 className="f-section">2. Bảo mật dữ liệu</h3>
                    <p className="f-body-sm lh-relaxed">TechZone sử dụng công nghệ mã hóa SSL và hệ thống microservices để đảm bảo dữ liệu cá nhân của bạn được cách ly và bảo vệ an toàn nhất.</p>
                </section>
            </article>
        </div>
    )
}

export default Privacy