import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      // Navigate to check inbox verification page with the provided email
      navigate('/check-inbox', { state: { email } });
    }, 600);
  };

  return (
    <AuthLayout hideTopRightAction={true}>
      {/* Forgot Password Card */}
      <div className="w-full max-w-[520px] bg-white border border-slate-100 rounded-3xl p-6 sm:p-9 lg:p-10 shadow-[0_10px_32px_-6px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.02)] box-border">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-1.5 text-[#0363C5] text-sm font-medium mb-6 transition-colors cursor-pointer bg-transparent border-none p-0 hover:text-blue-700"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-black text-2xl sm:text-[32px] font-extrabold tracking-[-0.025em] leading-tight mb-2.5">
            Forgot your password?
          </h2>
          <p className="text-[#64748B] font-normal text-sm sm:text-[14.5px] leading-relaxed font-['Inter',sans-serif]">
            Enter the email tied to your account and we&apos;ll send a 6-digit reset
            code.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 pl-11 pr-3.5 border border-slate-200 rounded-xl text-sm font-['Inter',sans-serif] text-slate-900 placeholder:text-slate-400 bg-white transition-all duration-200 outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="group w-full h-12 mt-3 bg-gradient-to-r from-[#5748f2] to-[#7633e8] hover:from-[#4f3ee8] hover:to-[#6d2bd8] text-white font-semibold text-sm sm:text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-[0px_4px_6px_-4px_#6366F140,0px_10px_15px_-3px_#6366F140] hover:shadow-[0px_6px_10px_-4px_#6366F160,0px_14px_20px_-3px_#6366F160] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <span>Send Reset Code</span>
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

export default ForgotPassword;
