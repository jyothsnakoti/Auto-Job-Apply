import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pencil, RefreshCw } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { verifyOtp, resendOtp } from '../../services/api';

const VerifyEmail = ({ email: propEmail }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const email =
    location.state?.email ||
    sessionStorage.getItem('pendingVerificationEmail') ||
    propEmail ||
    '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [activeInput, setActiveInput] = useState(0);
  const [timer, setTimer] = useState(60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const inputRefs = useRef([]);

  // Resend countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Focus active input
  useEffect(() => {
    if (inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [activeInput]);

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (errorMessage) {
      setErrorMessage('');
    }
    if (!val) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    // Strictly accept only numeric digits
    const digitsOnly = val.replace(/\D/g, '');
    if (!digitsOnly) return;

    const lastChar = digitsOnly.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = lastChar;
    setOtp(newOtp);

    // Auto advance to next box
    if (index < 5) {
      setActiveInput(index + 1);
    }
  };

  const handleKeyDown = (e, index) => {
    if (
      e.key === 'Backspace' ||
      e.key === 'Tab' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Delete' ||
      e.ctrlKey ||
      e.metaKey
    ) {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newOtp = [...otp];
        if (newOtp[index]) {
          newOtp[index] = '';
          setOtp(newOtp);
        } else if (index > 0) {
          newOtp[index - 1] = '';
          setOtp(newOtp);
          setActiveInput(index - 1);
        }
      } else if (e.key === 'ArrowLeft' && index > 0) {
        setActiveInput(index - 1);
      } else if (e.key === 'ArrowRight' && index < 5) {
        setActiveInput(index + 1);
      }
      return;
    }

    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (errorMessage) {
      setErrorMessage('');
    }
    const pastedData = e.clipboardData.getData('text');
    const numericDigits = pastedData.replace(/\D/g, '').split('').slice(0, 6);
    if (numericDigits.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      numericDigits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      setActiveInput(Math.min(numericDigits.length, 5));
    }
  };

  const handleResend = async () => {
    if (isResending) return;

    if (!email || email === 'your email') {
      setErrorMessage('No valid email address found. Please register or re-enter your email.');
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsResending(true);

    try {
      const response = await resendOtp({ email: email.trim() });
      setSuccessMessage(
        response?.message || 'A new 6-digit verification code has been sent to your email.'
      );
      setTimer(60);
    } catch (error) {
      setErrorMessage(
        error.message || 'Failed to resend verification code. Please try again.'
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 6 || otp.some((digit) => !digit || !/^\d$/.test(digit))) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const response = await verifyOtp({
        email: email.trim(),
        otp: enteredOtp,
      });

      navigate('/login', {
        state: { email: email.trim(), verified: true, responseData: response },
      });
    } catch (error) {
      setErrorMessage(
        error.message || 'Invalid verification code. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <AuthLayout hideTopRightAction={true}>
      {/* Verify Email Card */}
      <div className="w-full max-w-[520px] bg-white border border-slate-100 rounded-3xl p-6 sm:p-9 lg:p-10 shadow-[0_10px_32px_-6px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] box-border">
        {/* Back Link Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-[#0363C5] text-sm font-medium mb-6 transition-colors cursor-pointer bg-transparent border-none p-0"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-black text-2xl sm:text-[32px] font-extrabold tracking-[-0.025em] leading-tight mb-2.5">
            Verify your email
          </h2>
          <p className="text-[#64748B] font-normal text-sm sm:text-[14px] leading-relaxed font-['Inter',sans-serif]">
            We&apos;ve sent a 6-digit verification code to{' '}
            <span className="font-semibold text-slate-900">{email}</span>. Enter
            the code below to confirm your account.
          </p>

          {/* Change Address Link */}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-1.5 text-[#4F46E5] text-xs sm:text-[13px] font-semibold mt-3 transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <Pencil size={13} />
            <span>Wrong email? Change address</span>
          </button>
        </div>

        {/* Success Alert Message */}
        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-[13px] font-medium flex items-center gap-2 animate-in fade-in">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* OTP Input Section */}
          <div className="flex flex-col">
            <label className="text-[#334155] text-[14px] font-semibold mb-3 block">
              Enter 6-digit verification code
            </label>
            <div
              className="grid grid-cols-6 gap-2 sm:gap-3"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => {
                const isFocused = activeInput === index;
                return (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={() => setActiveInput(index)}
                    className={`w-full h-13 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-200 outline-none ${
                      isFocused
                        ? 'border-2 border-[#2563EB] ring-4 ring-blue-500/15 bg-white text-slate-900'
                        : digit
                        ? 'border-slate-200 bg-white text-slate-900'
                        : 'border-slate-200 bg-white text-slate-400'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting || otp.some((d) => !d || !/^\d$/.test(d))}
            className="group w-full h-12 mt-2 bg-gradient-to-r from-[#5748f2] to-[#7633e8] hover:from-[#4f3ee8] hover:to-[#6d2bd8] text-white font-semibold text-sm sm:text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-[0px_4px_6px_-4px_#6366F140,0px_10px_15px_-3px_#6366F140] hover:shadow-[0px_6px_10px_-4px_#6366F160,0px_14px_20px_-3px_#6366F160] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>{isSubmitting ? 'Verifying...' : 'Verify & Continue'}</span>
            {!isSubmitting && (
              <ArrowRight
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            )}
          </button>

          {/* Footer Resend Code Info & Button */}
          <div className="flex items-center justify-between pt-1 font-['Inter',sans-serif]">
            <span className="text-slate-500 text-xs sm:text-[13px]">
              Didn&apos;t receive the email?
            </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-[#4F46E5] hover:text-indigo-800 text-xs sm:text-[13px] font-bold cursor-pointer border-none bg-transparent p-0 transition-colors disabled:opacity-60"
            >
              <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
              <span>
                {isResending
                  ? 'Sending...'
                  : timer > 0
                  ? `Resend code (${formatTimer(timer)})`
                  : 'Resend code'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};
export default VerifyEmail;
