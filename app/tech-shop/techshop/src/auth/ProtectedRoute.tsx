import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "../store/hook";

export default function ProtectedRoute() {
  const { status } = useAppSelector((s) => s.auth);
  const loc = useLocation();

  if (status === "idle" || status === "loading") {
    return <div className="p-4">Checking session...</div>;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
}
