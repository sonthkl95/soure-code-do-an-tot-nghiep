// src/routes/PermissionRoute.tsx
import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "../store/hook";

export default function PermissionRoute({ allow }: { allow: string[] }) {
  const user = useAppSelector((s) => s.auth.user);

  const ok = allow.every((p) => user?.permissions?.includes(p));
  if (!ok) return <Navigate to="/403" replace />; // 403 hợp nghĩa hơn

  return <Outlet />;
}
