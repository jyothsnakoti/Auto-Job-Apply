import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import AuthLayout from './AuthLayout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.33.82:8081';

const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (error) setError('');
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');

    const emailTrimmed = (formData.email || '').trim();
    const password = formData.password || '';

    if (!emailTrimmed) {
      setError('Please enter your email address.');
      return;
    }

    if (!validateEmail(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailTrimmed,
          password: password,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        // Non-JSON response
      }

      if (response.ok) {
        // Extract token & user if provided
        const token =
          data.token ||
          data.accessToken ||
          data.jwt ||
          data.data?.token ||
          data.data?.accessToken ||
          data.data?.jwt ||
          '';

        const user = data.user || data.data?.user || (data.email ? { email: data.email } : null);

        const storage = formData.rememberMe ? localStorage : sessionStorage;
        const altStorage = formData.rememberMe ? sessionStorage : localStorage;

        // Clear alternate storage to prevent conflicting states
        altStorage.removeItem('authToken');
        altStorage.removeItem('token');
        altStorage.removeItem('authUser');
        altStorage.removeItem('user');

        if (token) {
          storage.setItem('authToken', token);
          storage.setItem('token', token);
        }
        if (user) {
          storage.setItem('authUser', JSON.stringify(user));
          storage.setItem('user', JSON.stringify(user));
        }

        navigate('/dashboard');
      } else {
        // Handle API error responses cleanly
        if (response.status === 401 || response.status === 403) {
          setError(data.message || data.error || 'Invalid email or password.');
        } else if (response.status === 404) {
          setError(data.message || data.error || 'Account not found. Please check your credentials.');
        } else if (response.status === 422) {
          setError(data.message || data.error || 'Invalid input details provided.');
        } else if (response.status >= 500) {
          setError('Server error. Please try again later.');
        } else {
          setError(data.message || data.error || 'Login failed. Please check your credentials and try again.');
        }
      }
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      topRightText="Not a member yet?"
      topRightButtonText="Create Account"
      topRightButtonHref="/register"
    >
      {/* Sign In Card */}
      <div className="w-full max-w-[520px] bg-white border border-slate-100 rounded-3xl p-6 sm:p-9 lg:p-10 shadow-[0_10px_32px_-6px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] box-border">
        {/* Card Header */}
        <div className="mb-6">
          <span className="text-[#4F46E5] text-xs font-bold tracking-[0.12em] uppercase mb-2 inline-block">
            WELCOME BACK
          </span>
          <h2 className="text-black text-2xl sm:text-[30px] font-extrabold tracking-[-0.025em] leading-tight mb-1.5">
            Sign in to your account
          </h2>
          <p className="text-[#64748B] font-regular text-sm sm:text-[14.5px] leading-relaxed font-['Inter',sans-serif]">
            Enter your credentials or use social sign-in to continue.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200/80 rounded-xl flex items-start gap-2.5 text-red-700 text-xs sm:text-[13px] leading-snug">
            <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />
            <span className="font-medium font-['Inter',sans-serif]">{error}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-4.5" noValidate>
          {/* Email Address */}
          <div className="flex flex-col">
            <label
              htmlFor="email"
              className="text-[#334155] text-[14px] font-semibold mb-1.5 block"
            >
              Email address
            </label>
            <div className="relative flex items-center w-full">
              <Mail
                className="absolute left-3.5 text-slate-400 pointer-events-none transition-colors duration-200"
                size={18}
              />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-12 pl-11 pr-3.5 border border-slate-200 rounded-xl text-sm font-['Inter',sans-serif] text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-200 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15"
                required
              />
            </div>
          </div>

          {/* Password with Forgot Password link */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="text-[#334155] text-[14px] font-semibold block"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[#4F46E5] hover:text-indigo-800 text-xs sm:text-[13px] font-semibold transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative flex items-center w-full">
              <Lock
                className="absolute left-3.5 text-slate-400 pointer-events-none transition-colors duration-200"
                size={18}
              />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full h-12 pl-11 pr-11 border border-slate-200 rounded-xl text-sm font-['Inter',sans-serif] text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-200 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1.5 rounded-md transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2.5 pt-0.5">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="w-4 h-4 text-[#4F46E5] border-slate-300 rounded focus:ring-indigo-500 cursor-pointer accent-[#4F46E5]"
            />
            <label
              htmlFor="rememberMe"
              className="text-slate-600 text-xs sm:text-[13px] font-normal select-none cursor-pointer font-['Inter',sans-serif]"
            >
              Remember me for 30 days
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group w-full h-12 mt-1 bg-gradient-to-r from-[#5748f2] to-[#7633e8] hover:from-[#4f3ee8] hover:to-[#6d2bd8] text-white font-semibold text-sm sm:text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-[0px_4px_6px_-4px_#6366F140,0px_10px_15px_-3px_#6366F140] hover:shadow-[0px_6px_10px_-4px_#6366F160,0px_14px_20px_-3px_#6366F160] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in to AutoApply</span>
                <ArrowRight
                  size={18}
                  className="transition-transform duration-200 group-hover:translate-x-1"
                />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center w-full gap-3 my-1.5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-slate-400 text-xs font-medium font-['Inter',sans-serif] uppercase tracking-wider whitespace-nowrap">
              OR SIGN IN WITH EMAIL
            </span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Google Button */}
            <button
              type="button"
              onClick={() => navigate('/plan')}
              className="h-11 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 active:bg-slate-100 text-slate-700 hover:text-slate-900 font-['Inter',sans-serif] text-xs sm:text-[13px] font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-xs cursor-pointer px-3 whitespace-nowrap"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                className="shrink-0"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* LinkedIn Button */}
            <button
              type="button"
              onClick={() => navigate('/plan')}
              className="h-11 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 active:bg-slate-100 text-slate-700 hover:text-slate-900 font-['Inter',sans-serif] text-xs sm:text-[13px] font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-xs cursor-pointer px-3 whitespace-nowrap"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="#0A66C2"
                className="shrink-0"
              >
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span>LinkedIn</span>
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;

