import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/ContextAuthentification';
import { LoadingProvider } from './contexts/LoadingContext';
import { RouterProvider } from 'react-router-dom';
import './styles/design-system.css';
import { router } from './router/routes';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <RouterProvider router={router} />
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
