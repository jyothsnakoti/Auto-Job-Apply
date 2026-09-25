import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import AuthLayout from './AuthLayout';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules
  const isLengthValid = password.length >= 8 && password.length <= 15;
  const hasUpperLower = /(?=.*[a-z])(?=.*[A-Z])/.test(password);
  const hasNumberSpecial = /(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(
    password
  );
  const isMatch = Boolean(password && confirmPassword && password === confirmPassword);

  const isValid = isLengthValid && hasUpperLower && hasNumberSpecial && isMatch;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate to password updated success screen
      navigate('/password-updated', { state: { email } });
    }, 600);
  };

  const checklistItems = [
    { label: '8-15 characters', valid: isLengthValid },
    { label: 'Upper & lowercase letters', valid: hasUpperLower },
    { label: 'Number & special character', valid: hasNumberSpecial },
    { label: 'Passwords match', valid: isMatch },
  ];

  return (
    <AuthLayout hideTopRightAction={true}>
      {/* Set New Password Card */}
      <div className="w-full max-w-[520px] bg-white border border-slate-100 rounded-3xl p-6 sm:p-9 lg:p-10 shadow-[0_10px_32px_-6px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] box-border">
        {/* Back Link Button */}
        <button
          type="button"
          onClick={() => navigate('/check-inbox')}
          className="inline-flex items-center gap-1.5 text-[#0363C5] text-sm font-medium mb-6 transition-colors cursor-pointer bg-transparent border-none p-0 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-black text-2xl sm:text-[32px] font-extrabold tracking-[-0.025em] leading-tight mb-2">
            Set a new password
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
          {/* New Password */}
          <div className="flex flex-col">
            <label
              htmlFor="newPassword"
              className="text-[#334155] text-[14px] font-semibold mb-1.5 block"
            >
              New Password
            </label>
            <div className="relative flex items-center w-full">
              <Lock
                className="absolute left-3.5 text-slate-400 pointer-events-none transition-colors duration-200"
                size={18}
              />
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          {/* Confirm New Password */}
          <div className="flex flex-col">
            <label
              htmlFor="confirmPassword"
              className="text-[#334155] text-[14px] font-semibold mb-1.5 block"
            >
              Confirm New Password
            </label>
            <div className="relative flex items-center w-full">
              <Lock
                className="absolute left-3.5 text-slate-400 pointer-events-none transition-colors duration-200"
                size={18}
              />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full h-12 pl-11 pr-11 border border-slate-200 rounded-xl text-sm font-['Inter',sans-serif] text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-200 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 p-1.5 rounded-md transition-colors cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Validation Checklist Box */}
          <div className="bg-[#F8FAFC]/70 border border-slate-100 rounded-xl p-4 flex flex-col gap-2.5 font-['Inter',sans-serif]">
            {checklistItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${
                    item.valid
                      ? 'text-emerald-600'
                      : 'text-slate-300'
                  }`}
                >
                  <Check size={14} strokeWidth={item.valid ? 2.8 : 2} />
                </div>
                <span
                  className={`text-xs sm:text-[13px] transition-colors duration-200 ${
                    item.valid ? 'text-slate-700 font-medium' : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Submit CTA Button */}
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="group w-full h-12 mt-2 bg-gradient-to-r from-[#5748f2] to-[#7633e8] hover:from-[#4f3ee8] hover:to-[#6d2bd8] text-white font-semibold text-sm sm:text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-[0px_4px_6px_-4px_#6366F140,0px_10px_15px_-3px_#6366F140] hover:shadow-[0px_6px_10px_-4px_#6366F160,0px_14px_20px_-3px_#6366F160] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>Reset password</span>
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

export default ResetPassword;
