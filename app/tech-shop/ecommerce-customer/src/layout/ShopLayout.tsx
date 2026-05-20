// src/layouts/ShopLayout.tsx
import { Outlet } from "react-router";
import Header from "./Header/Header";
import Footer from "./Footer/Footer";

export default function ShopLayout() {
  return (
    <>
      <Header />
      <div className="app-content">
        <div className="container">
          <Outlet />
        </div>
      </div>
      <Footer />
    </>
  );
}
