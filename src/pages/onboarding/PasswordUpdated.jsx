import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';

const PasswordUpdated = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  const handleContinue = () => {
    navigate('/login', { state: { email } });
  };

  return (
    <AuthLayout hideTopRightAction={true}>
      {/* Password Updated Success Card */}
      <div className="w-full max-w-[520px] bg-white border border-slate-100 rounded-3xl p-8 sm:p-10 lg:p-12 shadow-[0_10px_32px_-6px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] box-border text-center">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-black text-2xl sm:text-[32px] font-extrabold tracking-[-0.025em] leading-tight mb-2.5">
            Password updated
          </h2>
          <p className="text-[#64748B] font-normal text-sm sm:text-[14.5px] leading-relaxed font-['Inter',sans-serif]">
            Your password has been reset. Use it next time you sign in.
          </p>
        </div>

        {/* Continue Button */}
        <button
          type="button"
          onClick={handleContinue}
          className="group w-full h-12 bg-gradient-to-r from-[#5748f2] to-[#7633e8] hover:from-[#4f3ee8] hover:to-[#6d2bd8] text-white font-semibold text-sm sm:text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-[0px_4px_6px_-4px_#6366F140,0px_10px_15px_-3px_#6366F140] hover:shadow-[0px_6px_10px_-4px_#6366F160,0px_14px_20px_-3px_#6366F160] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
        >
          <span>Continue to Sign in</span>
          <ArrowRight
            size={18}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </button>
      </div>
    </AuthLayout>
  );
};

export default PasswordUpdated;
