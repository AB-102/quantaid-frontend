// src/components/Login.tsx

import { useAuth } from '@/AuthContext';
import api from '@/api';
import GoogleIcon from '@/assets/google-icon.svg';
import LoginGraphic from '@/assets/login-graphic.svg';
import QuantaidLogo from '@/assets/quantaid-logo.svg';
import { useGoogleLogin } from '@react-oauth/google';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';


const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // new users start in sign-up mode, returning users start in login mode
  const [isSignUpMode, setIsSignUpMode] = useState(() => localStorage.getItem('loggedInUserEmail') === null);
  const [isLoading, setIsLoading] = useState(false);
  const googleButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMode = () => setIsSignUpMode(prev => !prev);

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      void (async () => {
        setIsLoading(true);
        try {
          const backendResponse = await api.post(
            '/append_user_id',
            { access_token: tokenResponse.access_token },
          );
          const { redirect_to: redirectTo, is_admin: isAdmin, email: userEmail } = backendResponse.data;
          localStorage.setItem('loggedInUserEmail', userEmail ?? '');

          authLogin(userEmail, isAdmin);

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
      {/* Loading Animation Overlay */}
      {isLoading && (
        <div
          className="
            fixed inset-0 z-9999 flex items-center justify-center bg-black/50
          "
          role="status"
          aria-live="polite"
          aria-label="Loading, please wait"
        >
          <div className="
            size-20 animate-spin rounded-full border-8 border-[#f3f3f3]
            border-t-brand-darkest
          " />
          <span className="sr-only">Loading...</span>
        </div>
      )}

      <div className="flex h-screen flex-row">
        {/* LEFT COLUMN */}
        <main
          className="
            relative flex w-full flex-1 items-center justify-center
            bg-brand-medium p-16
            md:flex-1
          "
          aria-label={isSignUpMode ? 'Sign up form' : 'Login form'}
        >
          {/* Logo — CSS mask for SVG colouring; position/size via className */}
          <div
            className="
              absolute top-3.75 left-3.75 z-1000 h-4.75 min-h-4.75 w-17.5
              min-w-17.5
            "
            style={{
              backgroundColor: '#F1E0E0',
              mask: `url(${QuantaidLogo}) no-repeat center`,
              maskSize: 'contain',
              WebkitMask: `url(${QuantaidLogo}) no-repeat center`,
              WebkitMaskSize: 'contain',
            }}
            role="img"
            aria-label="Quantaid logo"
          />

          <div className="w-full max-w-120">
            {/* "Welcome back!" title — login mode only */}
            {!isSignUpMode && (
              <h1 className="
                mb-12 text-center font-inter text-[2.2rem] font-normal
                text-[#F1E0E0]
              ">
                Welcome back!
              </h1>
            )}

            <button
              ref={googleButtonRef}
              type="button"
              className="
                relative mx-auto flex h-12 w-100 max-w-100 min-w-min
                cursor-pointer appearance-none items-center justify-center
                overflow-hidden rounded-sm border-none bg-[#F2F2F2] px-3
                text-center align-middle font-roboto text-base font-medium
                tracking-[0.25px] whitespace-nowrap text-[#1F1F1F]
                transition-[background-color,border-color,box-shadow]
                duration-218 outline-none select-none
              "
              onClick={() => login()}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DFE1E3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#F2F2F2'; }}
              aria-label={isSignUpMode ? 'Sign up with Google' : 'Continue with Google'}
            >
              <img src={GoogleIcon} alt="" className="mr-[0.7rem] h-6.5" aria-hidden="true" />
              <span>{isSignUpMode ? 'Sign up with Google' : 'Continue with Google'}</span>
            </button>

            {/* Terms / privacy — sign-up mode only */}
            {isSignUpMode && (
              <p className="mt-6 text-left text-sm leading-[1.4] text-[#B4B6BE]">
                By clicking Sign up with Google, you acknowledge that you have read and agree to Quantaid's{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    font-normal text-brand-focus no-underline
                    hover:underline
                  "
                >
                  Terms of Use
                </a>{' '}
                and{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    font-normal text-brand-focus no-underline
                    hover:underline
                  "
                >
                  Privacy Policy
                </a>.
              </p>
            )}

            {/* Toggle between sign-up and login */}
            <p className="mt-0 text-center text-base font-normal text-[#C1C5D6]">
              {isSignUpMode ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="
                      text-button cursor-pointer border-none bg-transparent p-0
                      font-inter text-base font-normal text-brand-focus
                      hover:underline
                    "
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
                    className="
                      text-button cursor-pointer border-none bg-transparent p-0
                      font-inter text-base font-normal text-brand-focus
                      hover:underline
                    "
                    aria-label="Switch to sign up mode"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </div>
        </main>

        {/* RIGHT COLUMN — hidden below md breakpoint */}
        <aside
          className="
            hidden flex-1 items-center justify-center bg-brand-bg p-16
            text-white
            md:flex
          "
          aria-label="Decorative illustration"
        >
          <img
            src={LoginGraphic}
            alt="Illustration of a student using Quantaid to learn quantum computing"
            className="mx-auto max-w-120"
          />
        </aside>
      </div>
    </>
  );
};

export default Login;
