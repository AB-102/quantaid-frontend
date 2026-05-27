// src/components/Login.tsx

import { useAuth } from '@/AuthContext';
import api from '@/api';
import GoogleIcon from '@/assets/google-icon.svg';
import LoginGraphic from '@/assets/login-graphic.svg';
import { useGoogleLogin } from '@react-oauth/google';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styles } from './LoginStyles';


const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // Returning users (have logged in before) start in login mode; new users start in sign-up mode
  const [isSignUpMode, setIsSignUpMode] = useState(() => localStorage.getItem('loggedInUserEmail') === null);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMode = () => setIsSignUpMode(prev => !prev);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      void (async () => {
        setIsLoading(true);
        try {
          // Send access token to backend — it verifies with Google server-side
          const backendResponse = await api.post(
            '/append_user_id',
            { access_token: tokenResponse.access_token },
          );
          const { redirect_to: redirectTo, is_admin: isAdmin, email: userEmail } = backendResponse.data;
          localStorage.setItem('loggedInUserEmail', userEmail ?? '');

          // Update auth context
          authLogin(userEmail, isAdmin);

          // Dev route to profile creation (after auth/session is established)
          if (String(import.meta.env.VITE_FORCE_PROFILE_CREATION).toLowerCase() === 'true') {
            navigate('/profile-creation');
            return;
          }

          if (isAdmin) {
            navigate('/admin-dashboard');
          } else if (redirectTo === 'map') {
            navigate('/map');
          } else {
            navigate('/profile-creation');
          }
        } catch (err) {
          console.error('Error during login:', err);
        } finally {
          setIsLoading(false);
        }
      })();
    },
    onError: (errorResponse) => {
      console.error('Login Failed:', errorResponse);
    },
  });

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          button:focus-visible {
            outline: 3px solid #A4C5FF !important;
            outline-offset: 2px !important;
          }

          button.text-button:focus-visible {
            outline: 2px solid #A4C5FF !important;
            outline-offset: 1px !important;
            border-radius: 2px;
          }

          @media screen and (max-width: 768px) {
            .right-column-responsive {
              display: none !important;
            }
            .left-column-responsive {
              flex: 1 !important;
              width: 100% !important;
            }
          }
        `}
      </style>

      {/* Loading Animation Overlay */}
      {isLoading && (
        <div
          style={styles.loadingOverlay}
          role="status"
          aria-live="polite"
          aria-label="Loading, please wait"
        >
          <div style={styles.spinner}></div>
          <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
            Loading...
          </span>
        </div>
      )}

      <div style={styles.container}>
        {/* LEFT COLUMN */}
        <main
          style={styles.leftColumn}
          className="left-column-responsive"
          aria-label={isSignUpMode ? 'Sign up form' : 'Login form'}
        >
          <div
            style={styles.logoStyle}
            role="img"
            aria-label="Quantaid logo"
          />
          <div style={styles.formContainer}>
            {/* "Welcome back!" title — login mode only */}
            {!isSignUpMode && (
              <h1 style={styles.welcomeTitle}>Welcome back!</h1>
            )}

            <button
              ref={googleButtonRef}
              type="button"
              style={styles.googleButton}
              onClick={() => login()}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DFE1E3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F2F2F2'; }}
              aria-label={isSignUpMode ? 'Sign up with Google' : 'Continue with Google'}
            >
              <img src={GoogleIcon} alt="" style={styles.googleIcon} aria-hidden="true" />
              <span>{isSignUpMode ? 'Sign up with Google' : 'Continue with Google'}</span>
            </button>

            {/* Terms / privacy — sign-up mode only */}
            {isSignUpMode && (
              <p style={{ ...styles.termsText, marginTop: '1.5rem' }}>
                By clicking Sign up with Google, you acknowledge that you have read and agree to QuantAid's{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.linkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  Terms of Use
                </a>{' '}
                and{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.linkStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  Privacy Policy
                </a>.
              </p>
            )}

            {/* Toggle between sign-up and login */}
            <p style={styles.loginLink}>
              {isSignUpMode ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    style={styles.toggleButton}
                    className="text-button"
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                    aria-label="Switch to login mode"
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    style={styles.toggleButton}
                    className="text-button"
                    onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                    aria-label="Switch to sign up mode"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </main>

        {/* RIGHT COLUMN */}
        <aside
          style={styles.rightColumn}
          className="right-column-responsive"
          aria-label="Decorative illustration"
        >
          <img
            src={LoginGraphic}
            alt="Illustration of a student using Quantaid to learn quantum computing"
            style={styles.rightContent}
          />
        </aside>
      </div>
    </>
  );
};

export default Login;
