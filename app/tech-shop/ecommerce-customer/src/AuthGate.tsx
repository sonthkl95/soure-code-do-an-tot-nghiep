// src/routes/AuthGate.tsx
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./store/hook";
import { fetchMe } from "./features/auth/auth.slice";
import { useGetWishlistQuery } from "./features/wishlist/wishlist.api";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  useEffect(() => {
    // chỉ gọi 1 lần / hoặc khi status idle
    if (status === "idle") dispatch(fetchMe());
  }, [status, dispatch]);
  useGetWishlistQuery(undefined, {
    skip: status != "authenticated",
    refetchOnMountOrArgChange: true
  })
  // Có thể render skeleton header + loading
  return <>{children}</>;
}
