import { Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { HomePage } from '@/pages/HomePage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { ProductListingPage } from '@/pages/ProductListingPage';
import { ProductDetailsPage } from '@/pages/ProductDetailsPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { AuthPage } from '@/pages/AuthPage';
import { AccountPage } from '@/pages/AccountPage';
import { SearchPage } from '@/pages/SearchPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

/**
 * Routes.
 *
 * `:slug` is deliberate: the backend keys products by slug and 404s `/5`
 * (API.md gotcha #2), so an id can never reach the detail endpoint.
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'categories/:slug', element: <ProductListingPage /> },
      { path: 'products', element: <ProductListingPage /> },
      { path: 'products/:slug', element: <ProductDetailsPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'login', element: <AuthPage mode="login" /> },
      { path: 'register', element: <AuthPage mode="register" /> },
      { path: 'account', element: <AccountPage /> },
      // Legacy/alternate spellings — keep old links working.
      { path: 'category/:slug', element: <Navigate to="/categories" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
