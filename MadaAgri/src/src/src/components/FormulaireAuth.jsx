import { useState } from 'react';
import '../styles/FormulaireAuth.css';
import { useAuth } from '../contexts/ContextAuthentification';

export default function FormulaireAuth({ onBack }) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', password: '', role: 'client' });
  const [signInForm, setSignInForm] = useState({ email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    <>
      <button
        type="button"
        className="back-home-btn"
        onClick={onBack}
        title="Retourner à l'accueil"
      >
        ← Retour
      </button>
      <div className={`auth-container ${isSignUp ? 'right-panel-active' : ''}`}>
        <div className="form-container sign-up-container">
          <form onSubmit={handleSignUpSubmit}>
            <h1>Create Account</h1>
            <div className="icon-container">
              <a href="#" className="icon-card facebook" onClick={(e) => e.preventDefault()} title="Sign up with Facebook">
                <i className="fab fa-facebook-f"></i>
                <span>Facebook</span>
              </a>
              <a href="#" className="icon-card instagram" onClick={(e) => e.preventDefault()} title="Sign up with Instagram">
                <i className="fab fa-instagram"></i>
                <span>Instagram</span>
              </a>
              <a href="#" className="icon-card google" onClick={(e) => e.preventDefault()} title="Sign up with Google">
                <i className="fab fa-google"></i>
                <span>Google</span>
              </a>
            </div>
            <span>or use your email for registration</span>
            <select
              name="role"
              value={signUpForm.role}
              onChange={handleSignUpChange}
            >
              <option value="farmer">Agriculteur</option>
              <option value="client">Client</option>
            </select>
            <input
              type="text"
              name="name"
              placeholder="Name"
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
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={signUpForm.password}
              onChange={handleSignUpChange}
            />
            <button className="margin-top-10" type="submit">
              Sign Up
            </button>
          </form>
        </div>

        <div className="form-container sign-in-container">
          <form onSubmit={handleSignInSubmit}>
            <h1>Sign in</h1>
            <div className="icon-container">
              <a href="#" className="icon-card facebook" onClick={(e) => e.preventDefault()} title="Sign in with Facebook">
                <i className="fab fa-facebook-f"></i>
                <span>Facebook</span>
              </a>
              <a href="#" className="icon-card instagram" onClick={(e) => e.preventDefault()} title="Sign in with Instagram">
                <i className="fab fa-instagram"></i>
                <span>Instagram</span>
              </a>
              <a href="#" className="icon-card google" onClick={(e) => e.preventDefault()} title="Sign in with Google">
                <i className="fab fa-google"></i>
                <span>Google</span>
              </a>
            </div>
            <span>or use your account</span>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={signInForm.email}
              onChange={handleSignInChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={signInForm.password}
              onChange={handleSignInChange}
            />
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}
            <a href="#">Forgot your password?</a>
            <button type="submit" disabled={loading}>
              {loading ? 'Loading...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="white-text">Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button
                type="button"
                className="ghost"
                onClick={() => setIsSignUp(false)}
              >
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="white-text">Hello, Friend!</h1>
              <p>Enter your personal details and start your journey with us</p>
              <button
                type="button"
                className="ghost"
                onClick={() => setIsSignUp(true)}
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
