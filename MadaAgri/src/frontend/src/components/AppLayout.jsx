import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import Navigation from '../pages/Composants/Navigation';
import SettingsLayout from './SettingsLayout';
import ModernFooter from '../pages/Composants/ModernFooter';
import GlobalLoader from './GlobalLoader';
import useRouteLoading from '../hooks/useRouteLoading';
import PageTransition from './PageTransition';
import styles from './AppLayout.module.css';

export const AppLayout = () => {
  const location = useLocation();
  const isSettingsPage = location.pathname.startsWith('/settings');
  const [navExpanded, setNavExpanded] = useState(false);
  useRouteLoading();

  // Settings page uses its own layout
  if (isSettingsPage) {
    return (
      <div className={clsx(styles['app-layout'], styles['settings-page'])}>
        <GlobalLoader />
        <SettingsLayout />
      </div>
    );
  }

  // Standard app layout
  return (
    <div className={clsx(styles['app-layout'], { [styles['nav-expanded']]: navExpanded })}>
      <GlobalLoader />
      <Navigation onNavExpanded={setNavExpanded} />
      <main className={clsx(styles['app-layout-main'])}>
        <AnimatePresence mode="wait">
          <PageTransition type="fade">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <ModernFooter />
    </div>
  );
};

export default AppLayout;