// src/pages/Unauthorized401.tsx
import { useLocation } from "react-router";

export default function Unauthorized401() {
  const location = useLocation();
  const from = (location.state as any)?.from;

  const goSSO = () => {
    // const redirectTo = encodeURIComponent(
    //   from ? `${window.location.origin}${from}` : window.location.href
    // );
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/user-idp`;
  };

  return (
    <div className="container py-5">
      <div className="text-center">
        <h1 className="mb-2">401</h1>
        <p className="text-muted mb-4">
          Bạn cần đăng nhập để truy cập trang này.
        </p>
        <button className="btn btn-primary" onClick={goSSO}>
          Đăng nhập bằng SSO
        </button>
      </div>
    </div>
  );
}
