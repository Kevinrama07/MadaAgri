import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import PageLoadingFallback from '../components/PageLoadingFallback';
import DashboardLayout from '../layouts/DashboardLayout';

// Public pages
const LandingPage = lazy(() => import('../pages/Landing/LandingPage'));
const FormulaireAuth = lazy(() => import('../pages/Connection/FormulaireAuth'));

// Dashboard pages (wrapped)
const FeedPageWrapper = lazy(() => import('../pages/Dashboard/FeedPageWrapper'));
const PublicationPageWrapper = lazy(() => import('../pages/Dashboard/PublicationPageWrapper'));
const NetworkPageWrapper = lazy(() => import('../pages/Dashboard/NetworkPageWrapper'));
const MessagesPageWrapper = lazy(() => import('../pages/Dashboard/MessagesPageWrapper'));
const ProductsPageWrapper = lazy(() => import('../pages/Dashboard/ProductsPageWrapper'));
const OrdersPageWrapper = lazy(() => import('../pages/Dashboard/OrdersPageWrapper'));
const ReceivedOrdersPageWrapper = lazy(() => import('../pages/Dashboard/ReceivedOrdersPageWrapper'));
const ProductManagementPageWrapper = lazy(() => import('../pages/Dashboard/ProductManagementPageWrapper'));
const CreateProductPageWrapper = lazy(() => import('../pages/Dashboard/CreateProductPageWrapper'));
const AgriculturePageWrapper = lazy(() => import('../pages/Dashboard/AgriculturePageWrapper'));
const RoutesPageWrapper = lazy(() => import('../pages/Dashboard/RoutesPageWrapper'));
const MeteoPageWrapper = lazy(() => import('../pages/Dashboard/MeteoPageWrapper'));
const DashboardPageWrapper = lazy(() => import('../pages/Dashboard/DashboardPageWrapper'));

// Shared pages
const MarketplacePage = lazy(() => import('../pages/Marketplace/MarketplacePage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetail/ProductDetailPage'));
const ProfilePage = lazy(() => import('../pages/Profile/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage'));

const withSuspense = (Component) => (
  <Suspense fallback={<PageLoadingFallback />}>
    <Component />
  </Suspense>
);

export const routes = [
  // Public routes
  { path: '/', element: withSuspense(LandingPage) },
  { path: '/login', element: withSuspense(FormulaireAuth) },

  // Dashboard layout (requires auth, shows Navbar)
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: withSuspense(FeedPageWrapper) },
      { path: 'post', element: withSuspense(PublicationPageWrapper) },
      { path: 'network', element: withSuspense(NetworkPageWrapper) },
      { path: 'messages', element: withSuspense(MessagesPageWrapper) },
      { path: 'stats', element: withSuspense(DashboardPageWrapper) },
      { path: 'products', element: withSuspense(ProductsPageWrapper) },
      { path: 'create', element: withSuspense(CreateProductPageWrapper) },
      { path: 'orders', element: withSuspense(OrdersPageWrapper) },
      { path: 'received-orders', element: withSuspense(ReceivedOrdersPageWrapper) },
      { path: 'product-management', element: withSuspense(ProductManagementPageWrapper) },
      { path: 'analysis', element: withSuspense(AgriculturePageWrapper) },
      { path: 'routes', element: withSuspense(RoutesPageWrapper) },
      { path: 'meteo', element: withSuspense(MeteoPageWrapper) },
    ],
  },

  // Marketplace (also under dashboard layout for nav consistency)
  {
    path: '/marketplace',
    element: <DashboardLayout />,
    children: [
      { index: true, element: withSuspense(MarketplacePage) },
      { path: ':id', element: withSuspense(ProductDetailPage) },
    ],
  },

  // Profile & Settings (under dashboard layout)
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { path: 'profile', element: withSuspense(ProfilePage) },
      { path: 'profile/:id', element: withSuspense(ProfilePage) },
      { path: 'settings', element: withSuspense(SettingsPage) },
    ],
  },
];

export const router = createBrowserRouter(routes);

export default router;