import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/ContextAuthentification';
import { Navbar } from '../components/Navbar';
import PageLoadingFallback from '../components/PageLoadingFallback';

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Outlet />
      </main>
    </div>
  );
}
