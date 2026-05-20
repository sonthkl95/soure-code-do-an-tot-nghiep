import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { NuqsAdapter } from 'nuqs/adapters/react'
// Inter
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

// Bootstrap (CSS build sẵn => không dính warning sass)
import "bootstrap/dist/css/bootstrap.min.css";


// App styles
import "./styles/main.scss";

import { Provider } from "react-redux"
import { store } from "./store/store"
import { createBrowserRouter, Navigate } from "react-router"
import { RouterProvider } from "react-router/dom"
import Dashboard from "./pages/Dashboard/Dashboard";
import RoleManagement from "./pages/Role/RoleManagement";
import Login from "./pages/Login/Login";
import AppBootstrap from "./AppBootstrap";
import ProtectedRoute from "./auth/ProtectedRoute";
import PublicRoute from "./auth/PublicRoute";
import RoleCreate from "./pages/Role/RoleCreate";
import FunctionManagement from "./pages/Function/FunctionManagement";
import SubFunctionManagement from "./pages/SubFunction/SubFunctionManagement";
import SubFunctionCreate from "./pages/SubFunction/SubFunctionCreate";
import { Bounce, ToastContainer } from "react-toastify";
import SubFunctionEdit from "./pages/SubFunction/SubFunctionEdit";
import SubFunctionDetail from "./pages/SubFunction/SubFunctionDetail ";
import FunctionCreate from "./pages/Function/FunctionCreate";
import FunctionEdit from "./pages/Function/FunctionEdit";
import FunctionDetail from "./pages/Function/FunctionDetail";
import RoleEdit from "./pages/Role/RoleEdit";
import RoleDetail from "./pages/Role/RoleDetail";
import CategoryManagement from "./pages/Category/CategoryManagement";
import CategoryCreate from "./pages/Category/CategoryCreate";
import CategoryDetail from "./pages/Category/CategoryDetail";
import CategoryEdit from "./pages/Category/CategoryEdit";
import AttributeManagement from "./pages/Attribute/AttributeManagement";
import AttributeCreate from "./pages/Attribute/AttributeCreate";
import AttributeEdit from "./pages/Attribute/AttributeEdit";
import AttributeDetail from "./pages/Attribute/AttributeDetail";
import BrandManagement from "./pages/Brand/BrandManagement";
import BrandCreate from "./pages/Brand/BrandCreate";
import BrandEdit from "./pages/Brand/BrandEdit";
import BrandDetail from "./pages/Brand/BrandDetail";
import ProductManagement from "./pages/Product/ProductManagement";
import ProductCreate from "./pages/Product/ProductCreate";
import ProductDetail from "./pages/Product/ProductDetail";
import ProductEdit from "./pages/Product/ProductEdit";
import OrderManagement from "./pages/Order/OrderManagement";
import OrderDetail from "./pages/Order/OrderDetail";
import OrderEdit from "./pages/Order/OrderEdit";
import UserManagement from "./pages/User/UserManagement";
import InventoryManagement from "./pages/inventory/InventoryManagement";
import ReviewManagement from "./pages/Review/ReviewManagement";
import ProfilePage from "./pages/Profile/ProfilePage";
const router = createBrowserRouter([
  {
    element: (
      <AppBootstrap>
        <PublicRoute />
      </AppBootstrap>
    ),
    children: [
      { path: "/login", element: <Login /> }
    ]
  },
  {
    element: (
      <AppBootstrap>
        <ProtectedRoute />
      </AppBootstrap>
    ),
    children: [
      {
        path: "/",
        element: <App />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "roles", element: <RoleManagement /> },
          { path: "roles/create", element: <RoleCreate /> },
          { path: "roles/edit/:id", element: <RoleEdit /> },
          { path: "roles/view/:id", element: <RoleDetail /> },
          { path: "functions", element: <FunctionManagement /> },
          { path: "functions/create", element: <FunctionCreate /> },
          { path: "functions/edit/:id", element: <FunctionEdit /> },
          { path: "functions/view/:id", element: <FunctionDetail /> },
          { path: "subfunctions", element: <SubFunctionManagement /> },
          { path: "subfunctions/edit/:id", element: <SubFunctionEdit /> },
          { path: "subfunctions/detail/:id", element: <SubFunctionDetail /> },
          { path: "subfunctions/create", element: <SubFunctionCreate /> },
          { path: "products", element: <ProductManagement /> },
          { path: "products/create", element: <ProductCreate /> },
          { path: "products/view/:id", element: <ProductDetail /> },
          { path: "products/edit/:id", element: <ProductEdit /> },
          { path: "orders", element: <OrderManagement /> },
          { path: "orders/view/:id", element: <OrderDetail /> },
          { path: "orders/edit/:id", element: <OrderEdit /> },
          { path: "categories", element: <CategoryManagement /> },
          { path: "categories/create", element: <CategoryCreate /> },
          { path: "categories/view/:id", element: <CategoryDetail /> },
          { path: "categories/edit/:id", element: <CategoryEdit /> },
          { path: "attributes", element: <AttributeManagement /> },
          { path: "attributes/create", element: <AttributeCreate /> },
          { path: "attributes/edit/:id", element: <AttributeEdit /> },
          { path: "attributes/view/:id", element: <AttributeDetail /> },
          { path: "users", element: <UserManagement /> },
          { path: "brands", element: <BrandManagement /> },
          { path: "brands/create", element: <BrandCreate /> },
          { path: "brands/edit/:id", element: <BrandEdit /> },
          { path: "brands/view/:id", element: <BrandDetail /> },
          { path: "inventories", element: <InventoryManagement /> },
          { path: "reviews", element: <ReviewManagement /> },
          { path: "profile", element: <ProfilePage /> },

        ]
      }
    ],
  },
  { path: "*", element: <div className="p-4">404 Not Found</div> },
])


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <NuqsAdapter>
        <RouterProvider router={router} />
        <ToastContainer
          position="top-center"
          autoClose={1500}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          transition={Bounce}
        />
      </NuqsAdapter>
    </Provider>
  </React.StrictMode>
);