import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./pages/Landing/Landing'));
const Marketplace = lazy(() => import('./pages/Marketplace/Marketplace'));
const Dashboard = lazy(() => import('./pages/Dashboard/Dashboard'));
const ProductDetail = lazy(() => import('./pages/ProductDetail/ProductDetail'));

function PageFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--background)',
      color: 'var(--text-muted)',
    }}>
      Loading...
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/marketplace/:id" element={<ProductDetail />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}