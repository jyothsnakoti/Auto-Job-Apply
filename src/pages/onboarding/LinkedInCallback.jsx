import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { loginWithLinkedIn, getLinkedInConfig } from '../../services/authService';
import { getBillingStatus } from '../../services/billingService';

const LinkedInCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('processing'); // 'processing' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const isExchangingRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate execution during React 18 StrictMode double-mounting
    if (isExchangingRef.current) return;
    isExchangingRef.current = true;

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // 1. Handle user cancellation or provider error
      if (error) {
        console.warn('LinkedIn authorization error:', error, errorDescription);
        if (
          error === 'user_cancelled_login' ||
          error === 'user_cancelled_authorize' ||
          error === 'access_denied'
        ) {
          navigate('/login', {
            replace: true,
            state: { info: 'LinkedIn sign-in was cancelled.' },
          });
          return;
        }

        setStatus('error');
        setErrorMessage(
          errorDescription || 'LinkedIn sign-in could not be completed. Please try again.'
        );
        return;
      }

      // 2. Check if authorization code exists
      if (!code) {
        setStatus('error');
        setErrorMessage('LinkedIn sign-in could not be completed.');
        return;
      }

      // 3. Security state validation
      const storedState = sessionStorage.getItem('linkedin_oauth_state');
      sessionStorage.removeItem('linkedin_oauth_state');

      if (!storedState || state !== storedState) {
        console.error('OAuth state validation mismatch');
        setStatus('error');
        setErrorMessage('Security validation failed. Please start the sign-in process again.');
        return;
      }

      const savedReturnTo = sessionStorage.getItem('linkedin_return_to') || '';
      const savedRememberMe = sessionStorage.getItem('linkedin_remember_me') !== 'false';
      const storedRedirectUri = sessionStorage.getItem('linkedin_redirect_uri');
      sessionStorage.removeItem('linkedin_return_to');
      sessionStorage.removeItem('linkedin_remember_me');
      sessionStorage.removeItem('linkedin_redirect_uri');

      const config = getLinkedInConfig();
      const redirectUriToUse = storedRedirectUri || config.redirectUri;

      try {
        // 4. Exchange authorization code with backend POST /api/auth/linkedin
        const result = await loginWithLinkedIn({
          code,
          redirectUri: redirectUriToUse,
          rememberMe: savedRememberMe,
        });

        // 5. Navigate using standard post-login flow
        if (savedReturnTo) {
          navigate(savedReturnTo, { replace: true });
          return;
        }

        try {
          const billing = await getBillingStatus(result.accessToken);
          if (billing && billing.hasPlan === true) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/plan', { replace: true });
          }
        } catch {
          navigate('/plan', { replace: true });
        }
      } catch (err) {
        console.error('LinkedIn exchange error:', err);
        setStatus('error');
        if (err?.status === 400 || err?.status === 401) {
          setErrorMessage(err.message || 'LinkedIn authentication was rejected. Please try again.');
        } else {
          setErrorMessage('LinkedIn sign-in failed. Please try again.');
        }
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  return (
    <AuthLayout
      topRightText="Need help?"
      topRightButtonText="Sign In"
      topRightButtonHref="/login"
    >
      <div className="w-full max-w-[520px] bg-white border border-slate-100 rounded-3xl p-6 sm:p-9 lg:p-10 shadow-[0_10px_32px_-6px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] box-border text-center">
        {status === 'processing' ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <Loader2 size={36} className="text-[#4F46E5] animate-spin" />
            <h2 className="text-xl font-bold text-slate-900">
              Completing LinkedIn Sign In...
            </h2>
            <p className="text-sm text-slate-500 max-w-sm">
              Please wait while we verify your LinkedIn account and set up your session.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1">
              <AlertCircle size={26} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Sign In Failed
            </h2>
            <p className="text-sm text-slate-600 max-w-sm">
              {errorMessage}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 h-11 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Return to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default LinkedInCallback;
