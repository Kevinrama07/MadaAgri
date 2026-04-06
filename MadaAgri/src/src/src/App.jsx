import { useState } from 'react';
import './App.css';
import Accueil from './components/Accueil';
import './styles/Accueil.css';
import FormulaireAuth from './components/FormulaireAuth';
import TableauDeBord from './components/TableauDeBord';
import { AuthProvider, useAuth } from './contexts/ContextAuthentification';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-main">
        <div className="app-container center-layout">
          <p className="text-white">Chargement...</p>
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
        <Accueil onConnect={() => setCurrentPage('login')} />
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
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

