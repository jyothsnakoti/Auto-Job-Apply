import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { signupUser } from '../../services/api';

const Registration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [hideValidationBox, setHideValidationBox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const password = formData.password || '';
  const isLengthValid = password.length >= 8 && password.length <= 15;
  const isUpperLowerValid = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const isNumSpecialValid = /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
  const allCriteriaValid = isLengthValid && isUpperLowerValid && isNumSpecialValid;

  // Auto close validation box once all criteria are met
  useEffect(() => {
    if (allCriteriaValid && password.length > 0) {
      const timer = setTimeout(() => {
        setHideValidationBox(true);
      }, 450);
      return () => clearTimeout(timer);
    } else {
      setHideValidationBox(false);
    }
  }, [allCriteriaValid, password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!allCriteriaValid) {
      setErrorMessage('Please ensure your password meets all required criteria.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await signupUser({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      const emailToVerify = formData.email.trim();
      const fullNameVal = formData.fullName.trim();
      sessionStorage.setItem('pendingVerificationEmail', emailToVerify);
      sessionStorage.setItem('pendingFullName', fullNameVal);
      sessionStorage.setItem('userFullName', fullNameVal);
      localStorage.setItem('userFullName', fullNameVal);

      navigate('/verify', {
        state: { email: emailToVerify, fullName: fullNameVal, responseData: response },
      });
    } catch (error) {
      setErrorMessage(
        error.message || 'Failed to create account. Please check your network or try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {/* Registration Card */}
      <div className="w-full max-w-[520px] bg-white border border-slate-100 rounded-3xl p-6 sm:p-9 lg:p-10 shadow-[0_10px_32px_-6px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] box-border">
        {/* Card Header */}
        <div className="mb-6">
          <span className="text-[#4F46E5] text-xs font-bold tracking-[0.12em] uppercase mb-2 inline-block">
            GET STARTED
          </span>
          <h2 className="text-black text-2xl sm:text-[30px] font-extrabold tracking-[-0.025em] leading-tight mb-1.5">
            Create your account
          </h2>
          <p className="text-[#6B7280] font-normal text-sm sm:text-[14.5px] leading-relaxed font-['Inter',sans-serif]">
            Start your smarter job search journey today.
          </p>
        </div>

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-[13px] font-medium flex items-center gap-2 animate-in fade-in">
            <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-4.5">
          {/* Full Name */}
          <div className="flex flex-col">
            <label
              htmlFor="fullName"
              className="text-slate-800 text-[13.5px] font-semibold mb-1.5 block"
            >
              Full name
            </label>
            <div className="relative flex items-center w-full">
              <User
                className="absolute left-3.5 text-slate-400 pointer-events-none transition-colors duration-200"
                size={18}
              />
              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full h-12 pl-11 pr-3.5 border border-slate-200 rounded-xl text-sm font-['Inter',sans-serif] text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-200 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15"
                required
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="flex flex-col">
            <label
              htmlFor="email"
              className="text-slate-800 text-[13.5px] font-semibold mb-1.5 block"
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

          {/* Password */}
          <div className="flex flex-col">
            <label
              htmlFor="password"
              className="text-slate-800 text-[13.5px] font-semibold mb-1.5 block"
            >
              Password
            </label>
            <div className="relative flex items-center w-full">
              <Lock
                className="absolute left-3.5 text-slate-400 pointer-events-none transition-colors duration-200"
                size={18}
              />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => {
                  setIsPasswordFocused(true);
                  if (!allCriteriaValid) setHideValidationBox(false);
                }}
                onBlur={() => {
                  setIsPasswordFocused(false);
                }}
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
            <p className="text-slate-400 text-[11.5px] font-normal mt-1.5 leading-normal font-['Inter',sans-serif]">
              Use at least 8 characters with a mix of letters, numbers and symbols.
            </p>

            {/* Dynamic Password Validation Requirements Box */}
            {((isPasswordFocused || password.length > 0) && !hideValidationBox && !allCriteriaValid) && (
              <div className="mt-2.5 p-3.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                {/* 8-15 characters */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isLengthValid ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200/80 text-slate-400'
                    }`}
                  >
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span
                    className={`text-[12px] font-['Inter',sans-serif] transition-colors duration-200 ${
                      isLengthValid ? 'text-slate-800 font-medium' : 'text-slate-400 font-normal'
                    }`}
                  >
                    8-15 characters
                  </span>
                </div>

                {/* Upper & lowercase letters */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isUpperLowerValid ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200/80 text-slate-400'
                    }`}
                  >
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span
                    className={`text-[12px] font-['Inter',sans-serif] transition-colors duration-200 ${
                      isUpperLowerValid ? 'text-slate-800 font-medium' : 'text-slate-400 font-normal'
                    }`}
                  >
                    Upper & lowercase letters
                  </span>
                </div>

                {/* Number & special character */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isNumSpecialValid ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200/80 text-slate-400'
                    }`}
                  >
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span
                    className={`text-[12px] font-['Inter',sans-serif] transition-colors duration-200 ${
                      isNumSpecialValid ? 'text-slate-800 font-medium' : 'text-slate-400 font-normal'
                    }`}
                  >
                    Number & special character
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group w-full h-12 mt-1 bg-gradient-to-r from-[#5748f2] to-[#7633e8] hover:from-[#4f3ee8] hover:to-[#6d2bd8] text-white font-semibold text-sm sm:text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-[0px_4px_6px_-4px_#6366F140,0px_10px_15px_-3px_#6366F140] hover:shadow-[0px_6px_10px_-4px_#6366F160,0px_14px_20px_-3px_#6366F160] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Creating account...' : 'Create account'}</span>
            {!isSubmitting && (
              <ArrowRight
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            )}
          </button>

          {/* Legal Terms & Privacy */}
          <p className="text-slate-500 text-[11.5px] text-center leading-normal font-['Inter',sans-serif] mt-0.5">
            By creating an account, you agree to our{' '}
            <a
              href="#terms"
              className="text-[#4f46e5] hover:text-indigo-800 hover:underline font-medium transition-colors"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="#privacy"
              className="text-[#4f46e5] hover:text-indigo-800 hover:underline font-medium transition-colors"
            >
              Privacy Policy
            </a>
            .
          </p>

          {/* Divider */}
          <div className="flex items-center w-full gap-3 my-1.5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-slate-400 text-xs font-medium font-['Inter',sans-serif] whitespace-nowrap">
              Or sign up with
            </span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Google Button */}
            <button
              type="button"
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
              <span>Continue with Google</span>
            </button>

            {/* LinkedIn Button */}
            <button
              type="button"
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
              <span>Continue with LinkedIn</span>
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Registration;
