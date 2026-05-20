import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "../store/hook";

export default function PublicRoute() {
  const { status } = useAppSelector((s) => s.auth);

  // Đang check session → chưa biết login hay chưa
  if (status === "idle" || status === "loading") {
    return <div className="p-4">Checking session...</div>;
  }

  // Đã login → đá về trang chính
  if (status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  // Chưa login → cho vào trang public (login)
  return <Outlet />;
}
