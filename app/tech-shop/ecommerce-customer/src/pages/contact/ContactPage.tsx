const ContactPage = () => {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="form-app bg-surface p-4 border-app--rounded shadow-sm">
            <h2 className="f-section mb-2">Liên hệ với chúng tôi</h2>
            <p className="f-caption mb-4">Chúng tôi sẽ phản hồi bạn trong vòng 24h làm việc.</p>

            <div className="mb-3">
              <label className="form-label">Họ và tên</label>
              <input type="text" className="form-control" placeholder="Nhập tên của bạn" />
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" placeholder="example@email.com" />
            </div>

            <div className="mb-4">
              <label className="form-label">Nội dung tin nhắn</label>
              <textarea className="form-control" rows={4} placeholder="Bạn cần hỗ trợ điều gì?"></textarea>
            </div>

            <button className="btn-app btn-app--block">Gửi yêu cầu</button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ContactPage