// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "../store/hook";

export default function ProtectedRoute() {
  const { status } = useAppSelector((s) => s.auth);
  const location = useLocation();

  // đang check /me
  if (status === "idle" || status === "loading") {
    return (
      <div className="container py-5">
        <div className="text-muted">Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  // chưa login => về 401 (có menu)
  if (status === "unauthenticated") {
    return <Navigate to="/401" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
