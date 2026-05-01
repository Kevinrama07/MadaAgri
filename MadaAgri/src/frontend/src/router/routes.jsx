import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PageLoadingFallback from '../components/PageLoadingFallback';

const Accueil = lazy(() => import('../pages/Publique/Accueil'));
const FormulaireAuth = lazy(() => import('../pages/Connection/FormulaireAuth'));

const TableauDeBord = lazy(() => import('../pages/Composants/TableauDeBord'));
const OptimisationItineraire = lazy(() => 
  import('../pages/Carte/OptimisationItineraire')
);
const Marketplace = lazy(() => import('../pages/Marketplace/Marketplace'));
const Cart = lazy(() => import('../pages/Marketplace/Cart'));
const Orders = lazy(() => import('../pages/Marketplace/Orders'));
const ReceivedOrders = lazy(() => import('../pages/Marketplace/ReceivedOrders'));
const AnalyseCulture = lazy(() => import('../pages/Cultures/AnalyseCulture'));
const Messages = lazy(() => import('../pages/Messages/ChatSidebar'));
const SettingsLayout = lazy(() => import('../components/SettingsLayout'));

export const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <Accueil />
          </Suspense>
        ),
      },
      {
        path: '/login',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <FormulaireAuth />
          </Suspense>
        ),
      },

      // Pages authenticées
      {
        path: '/dashboard',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <TableauDeBord />
          </Suspense>
        ),
      },
      {
        path: '/optimization',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <OptimisationItineraire />
          </Suspense>
        ),
      },
      {
        path: '/marketplace',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <Marketplace />
          </Suspense>
        ),
      },
      {
        path: '/marketplace/cart',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <Cart />
          </Suspense>
        ),
      },
      {
        path: '/marketplace/orders',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <Orders />
          </Suspense>
        ),
      },
      {
        path: '/marketplace/received-orders',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ReceivedOrders />
          </Suspense>
        ),
      },
      {
        path: '/cultures',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AnalyseCulture />
          </Suspense>
        ),
      },
      {
        path: '/messages',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <Messages />
          </Suspense>
        ),
      },
      {
        path: '/settings',
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <SettingsLayout />
          </Suspense>
        ),
        children: [
          {
            path: ':section',
            element: (
              <Suspense fallback={<PageLoadingFallback />}>
                <SettingsLayout />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);

export default router;
