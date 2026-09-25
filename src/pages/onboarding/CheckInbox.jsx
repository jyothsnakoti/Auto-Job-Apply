import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';

const CheckInbox = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [activeInput, setActiveInput] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRefs = useRef([]);

  // Focus active input
  useEffect(() => {
    if (inputRefs.current[activeInput]) {
      inputRefs.current[activeInput].focus();
    }
  }, [activeInput]);

  const handleChange = (e, index) => {
    const val = e.target.value;
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
    // Allow navigation, control keys, and keyboard shortcuts
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

    // Prevent any key that is not a numeric digit 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    // Filter out all non-digits from pasted content
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.some((digit) => !digit || !/^\d$/.test(digit))) {
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate to set new password page
      navigate('/reset-password', { state: { email } });
    }, 600);
  };

  return (
    <AuthLayout hideTopRightAction={true}>
      {/* Check Inbox Card */}
      <div className="w-full max-w-[520px] bg-white border border-slate-100 rounded-3xl p-6 sm:p-9 lg:p-10 shadow-[0_10px_32px_-6px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] box-border">
        {/* Back Link Button */}
        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className="inline-flex items-center gap-1.5 text-[#0363C5] text-sm font-medium mb-6 transition-colors cursor-pointer bg-transparent border-none p-0 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-black text-2xl sm:text-[32px] font-extrabold tracking-[-0.025em] leading-tight mb-2">
            Check your inbox
          </h2>
          <p className="text-[#64748B] font-normal text-sm sm:text-[14.5px] leading-relaxed font-['Inter',sans-serif]">
            We sent a 6-digit code to your email.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* OTP Input Section */}
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

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting || otp.some((d) => !d || !/^\d$/.test(d))}
            className="group w-full h-12 mt-1 bg-gradient-to-r from-[#5748f2] to-[#7633e8] hover:from-[#4f3ee8] hover:to-[#6d2bd8] text-white font-semibold text-sm sm:text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-[0px_4px_6px_-4px_#6366F140,0px_10px_15px_-3px_#6366F140] hover:shadow-[0px_6px_10px_-4px_#6366F160,0px_14px_20px_-3px_#6366F160] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>Verify & Continue</span>
            <ArrowRight
              size={18}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default CheckInbox;
