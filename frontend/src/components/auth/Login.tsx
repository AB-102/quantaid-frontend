// src/components/Login.tsx

import { useAuth } from '@/AuthContext';
import api, { BACKEND_URL } from '@/api';
import GoogleIcon from '@/assets/google-icon.svg';
import LoginGraphic from '@/assets/login-graphic.svg';
import QuantaidLogo from '@/assets/quantaid-logo.svg';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';

// GET /api/auth/config: a Rice deployment signs in with Rice SSO only, any other deployment with Google
type AuthConfig =
  | { isRiceDeployment: false; googleClientId: string }
  | { isRiceDeployment: true; googleClientId: null };

const signInButtonClass = `
  relative mx-auto flex h-12 w-100 max-w-100 min-w-min
  cursor-pointer appearance-none items-center justify-center
  overflow-hidden rounded-sm border-none bg-[#F2F2F2] px-3
  text-center align-middle font-roboto text-base font-medium
  tracking-[0.25px] whitespace-nowrap text-[#1F1F1F]
  transition-[background-color,border-color,box-shadow]
  duration-218 outline-none select-none
`;

// Staging backends run on Render's free tier, which sleeps after 15 idle minutes and takes ~50s to wake
const isRenderBackend = BACKEND_URL.includes('.onrender.com');

const hoverOn = (e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = '#DFE1E3'; };
const hoverOff = (e: MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.backgroundColor = '#F2F2F2'; };

// useGoogleLogin needs the GoogleOAuthProvider above it, so the Google button is its own component
const GoogleSignInButton = ({ label, onAccessToken }: { label: string; onAccessToken: (accessToken: string) => void }) => {
  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => { onAccessToken(tokenResponse.access_token); },
    onError: (errorResponse) => { console.error('Login Failed:', errorResponse); },
  });

  return (
    <button
      type="button"
      className={signInButtonClass}
      onClick={() => login()}
      onMouseEnter={hoverOn}
      onMouseLeave={hoverOff}
      aria-label={label}
    >
      <img src={GoogleIcon} alt="" className="mr-[0.7rem] h-6.5" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
};

// Rice SSO is a full-page redirect through the backend (OIDC authorization code flow, GitHub #17).
// Until that's built, the backend answers with a "not yet configured" error.
const RiceSignInButton = () => (
  <button
    type="button"
    className={signInButtonClass}
    onClick={() => { window.location.assign(`${BACKEND_URL}/api/auth/rice/login`); }}
    onMouseEnter={hoverOn}
    onMouseLeave={hoverOff}
  >
    I'm a Rice Student
  </button>
);

// Holds the sign-in button's place while GET /api/auth/config loads, so the page doesn't shift when the real button arrives
const SignInButtonPlaceholder = () => (
  <button
    type="button"
    disabled
    className={`
      ${signInButtonClass}
      disabled:cursor-default disabled:opacity-60
    `}
  >
    <span
      className="
        mr-[0.7rem] size-5 animate-spin rounded-full border-2 border-[#C7C7C7]
        border-t-[#1F1F1F]
      "
      aria-hidden="true"
    />
    <span>Loading sign-in…</span>
  </button>
);

// TODO: replace in the SSO-only redesign. Login went SSO-only for dual deployment (Rice/Google SSO) and
// security, so the email/password flow was removed in frontend f2e66ed and backend b08df52. This is a
// disabled, look-only copy of that form, kept so the page doesn't look half-empty until then.
const inputContainerClass = 'mb-6 text-left';
const labelClass = 'mb-[0.3rem] block text-[1.3rem] text-[#F1E0E0]';
const inputClass = `
  w-full cursor-not-allowed rounded-sm bg-[#748ECB] p-4 font-inter
  text-[1.2rem] leading-[1.2] tracking-[-0.01em] text-[#1F1A2A]
  placeholder:text-[#1F1A2A]/60
`;

const EmailPasswordPlaceholder = ({ isSignUpMode }: { isSignUpMode: boolean }) => (
  <fieldset disabled>
    <div className="my-[3.4rem] flex w-full items-center">
      <div className="-mx-4 mt-[0.03rem] h-px flex-1 bg-[#ccc]" />
      <span className="
        relative z-1 mx-4 bg-brand-medium px-2 text-[.7rem] whitespace-nowrap
        text-brand-subtle
      ">OR</span>
      <div className="-mx-4 mt-[0.03rem] h-px flex-1 bg-[#ccc]" />
    </div>

    <div className={inputContainerClass}>
      <label htmlFor="email-input" className={labelClass}>Email</label>
      <input id="email-input" type="email" placeholder="Name@gmail.com" className={inputClass} />
    </div>

    {isSignUpMode && (
      <div className={inputContainerClass}>
        <label htmlFor="name-input" className={labelClass}>Name</label>
        <p className="
          mt-[-0.4rem] mb-[0.4rem] text-left text-[0.85rem] leading-[1.4]
          text-[#F1E0E0]
        ">
          This name will appear on your profile
        </p>
        <input id="name-input" type="text" placeholder="John/Jane Doe" className={inputClass} />
      </div>
    )}

    <div className={inputContainerClass}>
      <label htmlFor="password-input" className={labelClass}>Password</label>
      <input id="password-input" type="password" placeholder="********" className={inputClass} />
    </div>

    {/* Terms / privacy — sign-up mode only */}
    {isSignUpMode && (
      <p className="mb-3.5 text-left text-sm leading-[1.4] text-[#B4B6BE]">
        By signing up, you acknowledge that you have read and agree to Quantaid's{' '}
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

    {!isSignUpMode && (
      <div className="mb-2 text-left">
        <button
          type="button"
          className="
            cursor-not-allowed p-0 font-inter text-[0.9rem] font-normal
            text-brand-focus underline
          "
        >
          Forgot my password
        </button>
      </div>
    )}

    <button
      type="button"
      className="
        my-8 w-full cursor-not-allowed rounded-full bg-brand-blue-mid p-[1.2rem]
        font-inter text-[1.3rem] leading-[1.2] font-medium tracking-[-0.01em]
        text-white
      "
    >
      {isSignUpMode ? 'SIGN UP' : 'LOG IN'}
    </button>
  </fieldset>
);

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  // new users start in sign-up mode, returning users start in login mode
  const [isSignUpMode, setIsSignUpMode] = useState(() => localStorage.getItem('loggedInUserEmail') === null);
  const [isLoading, setIsLoading] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [authConfigFailed, setAuthConfigFailed] = useState(false);

  useEffect(() => {
    api.get<AuthConfig>('/auth/config')
      .then(res => { setAuthConfig(res.data); })
      .catch(() => { setAuthConfigFailed(true); });
  }, []);

  // waiting a few seconds before explaining the delay keeps the note from flashing when the backend is awake
  const [isSlowToLoad, setIsSlowToLoad] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => { setIsSlowToLoad(true); }, 3000);
    return () => { clearTimeout(timer); };
  }, []);

  const isConfigLoading = authConfig === null && !authConfigFailed;

  const toggleMode = () => setIsSignUpMode(prev => !prev);

  const signInWithGoogle = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const backendResponse = await api.post('/auth/google', { accessToken });
      const { redirectTo, isAdmin, email: userEmail } = backendResponse.data;
      localStorage.setItem('loggedInUserEmail', userEmail ?? '');

      authLogin(userEmail, isAdmin);

      if (isAdmin) {
        void navigate('/admin-dashboard');
      } else if (redirectTo === 'map') {
        void navigate('/map');
      } else {
        void navigate('/profile-creation');
      }
    } catch (err) {
      console.error('Error during login:', err);
    } finally {
      setIsLoading(false);
    }
  };

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

            {authConfigFailed && (
              <p className="text-center text-base text-[#F1E0E0]">
                Sign-in is unavailable right now. Please try again later.
              </p>
            )}

            {isConfigLoading && <SignInButtonPlaceholder />}

            {authConfig !== null && (authConfig.isRiceDeployment ? (
              <RiceSignInButton />
            ) : (
              <GoogleOAuthProvider clientId={authConfig.googleClientId}>
                <GoogleSignInButton
                  label={isSignUpMode ? 'Sign up with Google' : 'Continue with Google'}
                  onAccessToken={(accessToken) => { void signInWithGoogle(accessToken); }}
                />
              </GoogleOAuthProvider>
            ))}

            <EmailPasswordPlaceholder isSignUpMode={isSignUpMode} />

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

          {/* Cold-start note — pinned to the bottom so it never shifts the form */}
          {isConfigLoading && isSlowToLoad && isRenderBackend && (
            <p className="
              absolute inset-x-16 bottom-8 text-center text-sm leading-[1.4]
              text-[#B4B6BE]
            ">
              This staging site's backend is hosted on Render, which sleeps when idle and can take 50+ seconds
              to wake up. Sign-in will appear as soon as it's ready.
            </p>
          )}
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
