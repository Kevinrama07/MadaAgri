import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import { FaFacebookF, FaGoogle, FaLinkedinIn } from 'react-icons/fa';
import { useAuth } from '../../contexts/ContextAuthentification';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './FormulaireAuth.module.css';

function MobileSwipe({ isSignUp, setIsSignUp }) {
  const trackRef = useRef(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handlePointerDown = useCallback((e) => {
    setIsDragging(true);
    startXRef.current = e.clientX || e.touches?.[0]?.clientX || 0;
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const x = e.clientX || e.touches?.[0]?.clientX || 0;
    setDragX(x - startXRef.current);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragX > 60) {
      setIsSignUp(false);
    } else if (dragX < -60) {
      setIsSignUp(true);
    }
    setDragX(0);
  }, [isDragging, dragX, setIsSignUp]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const thumbBase = isSignUp ? 'calc(100% - 16px)' : '16px';

  return (
    <div className={styles.mobileSwipe}>
      <div className={styles.swipeTabs}>
        <button
          className={`${styles.swipeTab} ${!isSignUp ? styles.swipeTabActive : ''}`}
          onClick={() => setIsSignUp(false)}
        >
          Sign In
        </button>
        <button
          className={`${styles.swipeTab} ${isSignUp ? styles.swipeTabActive : ''}`}
          onClick={() => setIsSignUp(true)}
        >
          Sign Up
        </button>
      </div>
      <div
        ref={trackRef}
        className={styles.swipeTrack}
        onPointerDown={handlePointerDown}
        style={{ touchAction: 'none' }}
      >
        <div
          className={styles.swipeIndicator}
          style={{ transform: `translateX(${isSignUp ? '100%' : '0%'})` }}
        />
        <div
          className={styles.swipeThumb}
          style={{
            left: thumbBase,
            transform: `translateX(${dragX}px)`,
          }}
        />
      </div>
    </div>
  );
}

export default function FormulaireAuth() {
  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpForm, setSignUpForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'client' });
  const [signInForm, setSignInForm] = useState({ email: '', password: '', role: 'client' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(null);

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignUpChange = (e) => {
    const updated = { ...signUpForm, [e.target.name]: e.target.value };
    setSignUpForm(updated);
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      if (updated.confirmPassword === '') {
        setPasswordMatch(null);
      } else if (updated.password === updated.confirmPassword) {
        setPasswordMatch(true);
      } else {
        setPasswordMatch(false);
      }
    }
  };

  const handleSignInChange = (e) => {
    setSignInForm({ ...signInForm, [e.target.name]: e.target.value });
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (!signUpForm.name.trim()) {
      setError('Le nom complet est requis');
      return;
    }
    if (!signUpForm.email.trim()) {
      setError("L'email est requis");
      return;
    }
    if (signUpForm.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(signUpForm.email, signUpForm.password, signUpForm.name, signUpForm.role);
      setSignUpForm({ name: '', email: '', password: '', confirmPassword: '', role: 'client' });
      // Rediriger vers le tableau de bord après inscription réussie
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du compte');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(signInForm.email, signInForm.password, signInForm.role);
      setSignInForm({ email: '', password: '', role: 'client' });
      // Rediriger vers le tableau de bord après connexion réussie
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgDecor}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />
      </div>

      <Link to="/" className={styles.backBtn}>
        <FiArrowLeft size={18} />
      </Link>

      <MobileSwipe isSignUp={isSignUp} setIsSignUp={setIsSignUp} />

      <div className={`${styles.container} ${isSignUp ? styles.rightPanelActive : ''}`} id="container">

        {/* Sign Up */}
        <div className={styles.formContainer}>
          <form onSubmit={handleSignUpSubmit} className={styles.signUpForm}>
            <h1>Créer un compte</h1>
            <div className={styles.socialContainer}>
              <a href="#" className={styles.social} onClick={(e) => e.preventDefault()}><FaFacebookF /></a>
              <a href="#" className={styles.social} onClick={(e) => e.preventDefault()}><FaGoogle /></a>
              <a href="#" className={styles.social} onClick={(e) => e.preventDefault()}><FaLinkedinIn /></a>
            </div>
            <span>ou utilisez votre email pour vous inscrire</span>

            <div className={styles.roleSelector}>
              <label className={styles.roleLabel}>Type d'utilisateur</label>
              <div className={styles.roleOptions}>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${signUpForm.role === 'farmer' ? styles.roleBtnActive : ''}`}
                  onClick={() => setSignUpForm({ ...signUpForm, role: 'farmer' })}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                  Agriculteur
                </button>
                <button
                  type="button"
                  className={`${styles.roleBtn} ${signUpForm.role === 'client' ? styles.roleBtnActive : ''}`}
                  onClick={() => setSignUpForm({ ...signUpForm, role: 'client' })}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Client
                </button>
              </div>
            </div>

            <input type="text" name="name" placeholder="Nom complet" value={signUpForm.name} onChange={handleSignUpChange} className={styles.input} />
            <input type="email" name="email" placeholder="Email" value={signUpForm.email} onChange={handleSignUpChange} className={styles.input} />
            <div className={styles.pwWrapper}>
              <input type={showSignUpPassword ? 'text' : 'password'} name="password" placeholder="Mot de passe" value={signUpForm.password} onChange={handleSignUpChange} className={styles.input} />
              <button type="button" className={styles.pwToggle} onClick={() => setShowSignUpPassword(!showSignUpPassword)}>
                {showSignUpPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            <div className={`${styles.pwWrapper} ${styles.hasMatchCheck}`}>
              <input type={showSignUpPassword ? 'text' : 'password'} name="confirmPassword" placeholder="Confirmer le mot de passe" value={signUpForm.confirmPassword} onChange={handleSignUpChange} className={`${styles.input} ${passwordMatch === true ? styles.pwMatch : ''} ${passwordMatch === false ? styles.pwMismatch : ''}`} />
              <button type="button" className={styles.pwToggle} onClick={() => setShowSignUpPassword(!showSignUpPassword)}>
                {showSignUpPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
              {passwordMatch !== null && signUpForm.confirmPassword && (
                <span className={`${styles.pwMatchIcon} ${passwordMatch ? styles.pwMatchIconOk : styles.pwMatchIconFail}`}>
                  {passwordMatch ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M20 6L9 17l-5-5" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  )}
                </span>
              )}
            </div>
            {error && <div className={styles.errorMsg}>{error}</div>}
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              <span className={styles.btnShimmer} />
              {submitting ? 'Création...' : 'S\'inscrire'}
            </button>
          </form>
        </div>

        {/* Sign In */}
        <div className={styles.formContainer}>
          <form onSubmit={handleSignInSubmit} className={styles.signInForm}>
            <h1>Se connecter</h1>
            <div className={styles.socialContainer}>
              <a href="#" className={styles.social} onClick={(e) => e.preventDefault()}><FaFacebookF /></a>
              <a href="#" className={styles.social} onClick={(e) => e.preventDefault()}><FaGoogle /></a>
              <a href="#" className={styles.social} onClick={(e) => e.preventDefault()}><FaLinkedinIn /></a>
            </div>
            <span>ou utilisez votre compte</span>

            <input type="email" name="email" placeholder="Email" value={signInForm.email} onChange={handleSignInChange} className={styles.input} />
            <div className={styles.pwWrapper}>
              <input type={showSignInPassword ? 'text' : 'password'} name="password" placeholder="Mot de passe" value={signInForm.password} onChange={handleSignInChange} className={styles.input} />
              <button type="button" className={styles.pwToggle} onClick={() => setShowSignInPassword(!showSignInPassword)}>
                {showSignInPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            <a href="#">Mot de passe oublié ?</a>
            {error && <div className={styles.errorMsg}>{error}</div>}
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              <span className={styles.btnShimmer} />
              {submitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        {/* Overlay */}
        <div className={styles.overlayContainer}>
          <div className={styles.overlay}>
            <div className={`${styles.overlayPanel} ${styles.overlayLeft}`}>
              <h1>Bon retour !</h1>
              <p>Pour rester connecté, connectez-vous avec vos informations personnelles</p>
              <button type="button" className={styles.ghost} onClick={() => setIsSignUp(false)}>Se connecter</button>
            </div>
            <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
              <h1>Salut, l'ami !</h1>
              <p>Entrez vos informations personnelles et commencez votre aventure avec nous</p>
              <button type="button" className={styles.ghost} onClick={() => setIsSignUp(true)}>S'inscrire</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
