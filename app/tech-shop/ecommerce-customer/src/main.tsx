import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/main.scss";
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';
import Home from './pages/home/Home.tsx';
import { Provider } from 'react-redux';
import { store } from './store/store.ts';
import { Bounce, ToastContainer } from 'react-toastify';
import ShopLayout from './layout/ShopLayout.tsx';
import Unauthorized401 from './auth/Unauthorized401.tsx';
import ProtectedRoute from './auth/ProtectedRoute.tsx';
import ProductList from './pages/product-list/ProductList.tsx';
import ProductDetailPage from './pages/product-detail/ProductDetail.tsx';
import AuthGate from './AuthGate.tsx';
import PermissionRoute from './auth/PermissionRoute.tsx';
import Profile from './pages/profile/Profile.tsx';
import Cart from './pages/cart/Cart.tsx';
import WishList from './pages/wishlist/WishList.tsx';
import WalletPage from './pages/wallet/WalletPage.tsx';
import CheckoutPage from './pages/checkout/CheckoutPage.tsx';
import OrderSuccessPage from './pages/order-success/OrderSuccessPage.tsx';
import MyOrdersPage from './pages/order/OrderPage.tsx';
import AddressBook from './pages/profile/AdressBook.tsx';
import MyProfile from './pages/profile/MyProfile.tsx';
import HelpCenter from './pages/helpcenter/HelpCenter.tsx';
import ContactPage from './pages/contact/ContactPage.tsx';
import Stores from './pages/stores/Stores.tsx';
import Privacy from './pages/privacy/Privacy.tsx';

export const router = createBrowserRouter([
  {
    element: <ShopLayout />,
    children: [
      // PUBLIC
      { path: "/", element: <Home /> },
      { path: "/p/:slug", element: <ProductDetailPage /> },
      { path: "/q/:categoryPath/*", element: <ProductList /> },
      { path: "/search", element: <ProductList /> },
      { path: "/help-center", element: <HelpCenter /> },
      { path: "/contact", element: <ContactPage /> },
      { path: "/stores", element: <Stores /> },
      { path: "/privacy-policy", element: <Privacy /> },


      // 401/403 vẫn có menu (vì nằm trong ShopLayout)
      { path: "/401", element: <Unauthorized401 /> },
      // { path: "/403", element: <Forbidden403 /> },

      // PRIVATE GROUP
      {
        element: <ProtectedRoute />,
        children: [
          // { path: "/account", element: <Account /> },
          // { path: "/orders", element: <Orders /> },
          {
            element: <PermissionRoute allow={["VIEW_CUSTOMER_PROFILE"]} />,
            children: [{ path: "/order-success", element: <OrderSuccessPage /> }],
          },
          {
            element: <PermissionRoute allow={["VIEW_CUSTOMER_PROFILE"]} />,
            children: [{ path: "/checkout", element: <CheckoutPage /> }],
          },
          {
            element: <PermissionRoute allow={["VIEW_CUSTOMER_PROFILE"]} />,
            children: [{ path: "/my-wallet", element: <WalletPage /> }],
          },
          {
            element: <PermissionRoute allow={["VIEW_CUSTOMER_PROFILE"]} />,
            children: [{ path: "/wishlist", element: <WishList /> }],
          },
          // // ADMIN theo permission
          {
            element: <PermissionRoute allow={["VIEW_CUSTOMER_PROFILE"]} />,
            children: [{ path: "/profile", element: <Profile />, children: [
              {index: true, element: <Navigate  to="account" replace />},
              {path: "account", element: <MyProfile />},
              {path: "orders", element: <MyOrdersPage />},
              {path: "address", element: <AddressBook />}
            ] }],
          },
          {
            element: <PermissionRoute allow={["VIEW_CART"]} />,
            children: [{ path: "/cart", element: <Cart /> }],
          },
        ],
      },

      // { path: "*", element: <NotFound404 /> },
    ],
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <AuthGate>
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
      </AuthGate>
    </Provider>
  </StrictMode>,
)
