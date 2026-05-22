import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/ContextAuthentification';
import { LoadingProvider } from './contexts/LoadingContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { RouterProvider } from 'react-router-dom';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import './styles/design-system.css';
import { router } from './router/routes';
import './i18n';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <LanguageProvider>
            <RouteErrorBoundary>
              <RouterProvider router={router} />
            </RouteErrorBoundary>
          </LanguageProvider>
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
