import { useState } from 'react';
import clsx from 'clsx';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FaFacebook, FaInstagram, FaGoogle } from 'react-icons/fa';
import styles from '../../styles/Connection/FormulaireAuth.module.css';
import { useAuth } from '../../contexts/ContextAuthentification';
import ThemeToggle from '../../components/ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';

export default function FormulaireAuth({ onBack }) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [signInForm, setSignInForm] = useState({ email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  const handleSignUpChange = (e) => {
    setSignUpForm({
      ...signUpForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSignInChange = (e) => {
    setSignInForm({
      ...signInForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Validation du rôle
    if (!signUpForm.role || !['farmer', 'client'].includes(signUpForm.role)) {
      setError('Veuillez sélectionner un rôle valide (Agriculteur ou Client)');
      setLoading(false);
      return;
    }
    
    console.log('Sign up avec rôle:', signUpForm.role, 'formData:', signUpForm);
    
    try {
      await signUp(
        signUpForm.email,
        signUpForm.password,
        signUpForm.name,
        signUpForm.role
      );
      setSignUpForm({ name: '', email: '', password: '', role: 'client' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(signInForm.email, signInForm.password, signInForm.role);
      setSignInForm({ email: '', password: '', role: 'client' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };
  return (
    <ThemeProvider>
      <>
        <ThemeToggle />
        <button
          type="button"
          className={clsx(styles['back-home-btn'])}
          onClick={onBack}
          title="Retourner à l'accueil"
        >
          ← Retour
        </button>
        
        {/* Mobile Tab Switcher */}
        <div className={clsx(styles['mobile-tab-switcher'])}>
          <button 
            type="button"
            className={clsx(styles['mobile-tab'], { [styles['active']]: !isSignUp })}
            onClick={() => setIsSignUp(false)}
          >
            Connexion
          </button>
          <button 
            type="button"
            className={clsx(styles['mobile-tab'], { [styles['active']]: isSignUp })}
            onClick={() => setIsSignUp(true)}
          >
            Inscription
          </button>
        </div>

        <div className={clsx(styles['auth-container'], { [styles['right-panel-active']]: isSignUp })}>
          <div className={clsx(styles['form-container'], styles['sign-up-container'])}>
            <form onSubmit={handleSignUpSubmit}>
              <h1>Créer un compte</h1>
              <div className={clsx(styles['icon-container'])}>
                <a href="#" className={clsx(styles['icon-card'])} onClick={(e) => e.preventDefault()} title="Sign up with Facebook">
                  <FaFacebook />
                  <span>Facebook</span>
                </a>
                <a href="#" className={clsx(styles['icon-card'])} onClick={(e) => e.preventDefault()} title="Sign up with Instagram">
                  <FaInstagram />
                  <span>Instagram</span>
                </a>
                <a href="#" className={clsx(styles['icon-card'])} onClick={(e) => e.preventDefault()} title="Sign up with Google">
                  <FaGoogle />
                  <span>Google</span>
                </a>
              </div>
              <span>ou utilisez votre email pour s'inscrire</span>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: '600' }}>
                Rôle:
              </label>
              <select
                name="role"
                value={signUpForm.role}
                onChange={handleSignUpChange}
                required
                style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem' }}
              >
                <option value="farmer">Agriculteur</option>
                <option value="client">Client</option>
              </select>
              <input
                type="text"
                name="name"
                placeholder="Nom"
                value={signUpForm.name}
                onChange={handleSignUpChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={signUpForm.email}
                onChange={handleSignUpChange}
              />
              <div className={clsx(styles['password-input-wrapper'])}>
                <input
                  type={showSignUpPassword ? "text" : "password"}
                  name="password"
                  placeholder="Mot de passe"
                  value={signUpForm.password}
                  onChange={handleSignUpChange}
                />
                <button
                  type="button"
                  className={clsx(styles['password-toggle-btn'])}
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  title={showSignUpPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showSignUpPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <button className={clsx(styles['margin-top-10'])} type="submit">
                S'inscrire
              </button>
              
              {/* Mobile: Link to switch to Sign In */}
              <div className={clsx(styles['mobile-form-switch'])}>
                <span className={clsx(styles['mobile-form-switch-text'])}>Déjà un compte ? </span>
                <span 
                  className={clsx(styles['mobile-form-switch-link'])}
                  onClick={() => setIsSignUp(false)}
                >
                  Se connecter
                </span>
              </div>
            </form>
          </div>

          <div className={clsx(styles['form-container'], styles['sign-in-container'])}>
            <form onSubmit={handleSignInSubmit}>
              <h1>Se connecter</h1>
              <div className={clsx(styles['icon-container'])}>
                <a href="#" className={clsx(styles['icon-card'])} onClick={(e) => e.preventDefault()} title="Sign in with Facebook">
                  <FaFacebook />
                  <span>Facebook</span>
                </a>
                <a href="#" className={clsx(styles['icon-card'])} onClick={(e) => e.preventDefault()} title="Sign in with Instagram">
                  <FaInstagram />
                  <span>Instagram</span>
                </a>
                <a href="#" className={clsx(styles['icon-card'])} onClick={(e) => e.preventDefault()} title="Sign in with Google">
                  <FaGoogle />
                  <span>Google</span>
                </a>
              </div>
              <span>ou utilisez votre compte</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={signInForm.email}
                onChange={handleSignInChange}
              />
              <div className={clsx(styles['password-input-wrapper'])}>
                <input
                  type={showSignInPassword ? "text" : "password"}
                  name="password"
                  placeholder="Mot de passe"
                  value={signInForm.password}
                  onChange={handleSignInChange}
                />
                <button
                  type="button"
                  className={clsx(styles['password-toggle-btn'])}
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  title={showSignInPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showSignInPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {error && (
                <div className={clsx(styles['auth-error'])}>
                  {error}
                </div>
              )}
              <a href="#">Mot de passe oublié?</a>
              <button type="submit" disabled={loading}>
                {loading ? 'Connexion ...' : 'Se connecter'}
              </button>
              
              {/* Mobile: Link to switch to Sign Up */}
              <div className={clsx(styles['mobile-form-switch'])}>
                <span className={clsx(styles['mobile-form-switch-text'])}>Pas encore de compte ? </span>
                <span 
                  className={clsx(styles['mobile-form-switch-link'])}
                  onClick={() => setIsSignUp(true)}
                >
                  S'inscrire
                </span>
              </div>
            </form>
          </div>

          <div className={clsx(styles['overlay-container'])}>
            <div className={clsx(styles['overlay'])}>
              <div className={clsx(styles['overlay-panel'], styles['overlay-left'])}>
                <h1 className={clsx(styles['white-text'])}>Bienvenue!</h1>
                <p>Pour créer votre compte, veuillez vous connecter avec vos informations personnelles. <br /> Connecez-vous si vous avez déjà un compte</p>
                <button
                  type="button"
                  className={clsx(styles['ghost'])}
                  onClick={() => setIsSignUp(false)}
                >
                  Se connecter
                </button>
              </div>
              <div className={clsx(styles['overlay-panel'], styles['overlay-right'])}>
                <h1 className={clsx(styles['white-text'])}>Bonjour !</h1>
                <p>Saisissez vos informations personnelles et commencez votre aventure avec nous. <br />Inscrivez-vous si pas encore de compte</p>
                <button
                  type="button"
                  className={clsx(styles['ghost'])}
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    </ThemeProvider>
  );
}
