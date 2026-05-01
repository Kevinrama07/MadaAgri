import { useState, useEffect } from 'react';
import './App.css';
import Accueil from './pages/Publique/Accueil';
import styles from './styles/Publique/Accueil.module.css';
import FormulaireAuth from './pages/Connection/FormulaireAuth';
import TableauDeBord from './pages/Composants/TableauDeBord';
import { AuthProvider, useAuth } from './contexts/ContextAuthentification';
import { LoadingProvider } from './contexts/LoadingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import GlobalLoader from './components/GlobalLoader';
import { FiAlertTriangle } from "react-icons/fi";

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { user, loading, error } = useAuth();

  // DEBUG: Forcer un re-render
  useEffect(() => {
  }, [user, loading, error]);


  if (loading && !error) {
    return (
      <div className="app-main">
        <div className="app-container center-layout">
          <p className="text-white">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error && !error.includes('Unauthorized') && !error.includes('401')) {
  return (
    <div className="error-page">
      <div className="error-card">
        <div className="error-icon">
          <FiAlertTriangle />
        </div>

        <h2>Une erreur est survenue</h2>
        <p className="error-message">{error}</p>

        <button
          className="reload-btn"
          onClick={() => window.location.reload()}
        >
          Recharger
        </button>
      </div>
    </div>
  );
}

  if (user) {
    return <TableauDeBord />;
  }
  return (
    <div className="app-main">
      {currentPage === 'home' ? (
        <Accueil onConnect={() => {
          console.log('onConnect called in App, setting page to login');
          setCurrentPage('login');
        }} />
      ) : (
        <div className="app-container">
          <div className="auth-wrapper">
            <FormulaireAuth onBack={() => setCurrentPage('home')} />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LoadingProvider>
          <GlobalLoader />
          <AppContent />
        </LoadingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

