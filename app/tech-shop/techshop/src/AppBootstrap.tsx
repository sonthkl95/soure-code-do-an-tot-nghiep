import { useEffect } from "react";
import { fetchMe } from "./features/auth/auth.slice";
import { useAppDispatch, useAppSelector } from "./store/hook";
import Loading from "./components/common/Loading";
import { Navigate, useLocation } from "react-router";
export default function AppBootstrap({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);
  const location = useLocation();
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchMe()); // ✅ hỏi backend xem có login không
    }
  }, [dispatch, status]);
  if (status === "idle" || status === "loading") {
    return (
      <Loading
        open
        variant="overlay"
        title="Đang tải…"
        subtitle="Vui lòng đợi giay lát..."

      />
    )
  }
  if (status === "unauthenticated") {
    if (location.pathname === "/login") return <>{children}</>;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
