import React from 'react';
import { Link } from 'react-router-dom';

const AuthLayout = ({
  children,
  topRightText = 'Already have an account?',
  topRightButtonText = 'Log in',
  topRightButtonHref = '/login',
  onTopRightButtonClick,
  hideTopRightAction = false,
  heroTag = 'AI-POWERED CAREER GROWTH',
  heroHeadline = (
    <>
      Dream jobs are<br />
      <span className="text-[#93C5FD]">closer</span> than you<br />
      think.
    </>
  ),
  heroDescription = 'Create your account and let AI find, match and apply to the right opportunities for you.',
}) => {
  return (
    <div className="flex min-h-screen w-full font-['Plus_Jakarta_Sans',sans-serif] bg-white text-slate-900 antialiased flex-col lg:flex-row selection:bg-indigo-500 selection:text-white">
      {/* =====================================================================
          LEFT SECTION - Dark Midnight Hero
          ===================================================================== */}
      <div className="relative flex-1 lg:flex-[1.05] bg-[#060814] flex flex-col justify-between p-6 sm:p-8 md:p-10 lg:p-12 xl:p-16 2xl:p-20 overflow-hidden min-h-[360px] sm:min-h-[420px] lg:min-h-screen select-none">
        {/* Layered Ambient Glow Lighting */}
        <div className="absolute -top-20 -left-20 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.38)_0%,rgba(37,99,235,0.15)_60%,transparent_80%)] blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-[320px] sm:w-[460px] h-[320px] sm:h-[460px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.25)_0%,rgba(99,102,241,0.12)_60%,transparent_80%)] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/4 w-60 sm:w-80 h-60 sm:h-80 rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.18)_0%,transparent_70%)] blur-3xl pointer-events-none" />

        {/* Top-Left Brand Logo */}
        <header className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 sm:gap-3 text-decoration-none">
            <svg
              width="34"
              height="34"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7 sm:w-[34px] sm:h-[34px] shrink-0 drop-shadow-[0_2px_8px_rgba(37,99,235,0.4)]"
            >
              <rect width="32" height="32" rx="8" fill="url(#brand-logo-grad)" />
              <path
                d="M16 6.8L9.2 23.2H13.1L16 16.2L18.9 23.2H22.8L16 6.8ZM16 11.2L17.9 15.6H14.1L16 11.2Z"
                fill="white"
              />
              <defs>
                <linearGradient
                  id="brand-logo-grad"
                  x1="0"
                  y1="32"
                  x2="32"
                  y2="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#2563EB" />
                  <stop offset="1" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
            </svg>
            <span className="text-white font-bold text-lg sm:text-xl tracking-tight">
              Auto Jobs Apply
            </span>
          </Link>
        </header>

        {/* Hero Copy / Content Area - Fully Responsive */}
        <div className="relative z-10 w-full max-w-full lg:max-w-[690px] mt-6 sm:mt-10 md:mt-14 lg:mt-20 xl:mt-28 2xl:mt-32 mb-6 lg:mb-auto py-2 sm:py-4">
          {heroTag && (
            <div className="text-[#818CF8] text-[11px] sm:text-xs md:text-[13px] xl:text-sm font-bold tracking-[0.14em] sm:tracking-[0.18em] uppercase mb-3 sm:mb-4 lg:mb-5 xl:mb-6">
              {heroTag}
            </div>
          )}
          {heroHeadline && (
            <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-[46px] xl:text-[56px] 2xl:text-[64px] font-extrabold leading-[1.15] sm:leading-[1.12] tracking-[-0.03em] mb-4 sm:mb-5 lg:mb-6 xl:mb-7">
              {heroHeadline}
            </h1>
          )}
          {heroDescription && (
            <p className="text-[#CBD5E1] font-normal text-sm sm:text-base md:text-base lg:text-[16px] xl:text-[17px] leading-relaxed sm:leading-[1.65] max-w-full sm:max-w-[480px] lg:max-w-[540px] font-['Inter',sans-serif]">
              {heroDescription}
            </p>
          )}
        </div>

        {/* Hidden bottom spacer for vertical balance */}
        <div className="hidden lg:block relative z-10 h-6" />
      </div>

      {/* =====================================================================
          RIGHT SECTION - Dynamic Right Container with Perfectly Aligned Card
          ===================================================================== */}
      <div className="relative flex-1 lg:flex-[1.1] bg-white flex items-center justify-center p-6 sm:p-8 md:p-10 lg:px-12 xl:px-16 py-8 sm:py-12 overflow-y-auto min-h-screen">
        {/* Subtle Ambient Corner Lighting */}
        <div className="absolute bottom-0 right-0 w-[300px] sm:w-[460px] h-[300px] sm:h-[460px] bg-[radial-gradient(circle_at_100%_100%,rgba(238,232,255,0.45)_0%,rgba(245,243,255,0.18)_40%,transparent_70%)] pointer-events-none z-0" />

        {/* Right Content Column */}
        <div className="relative z-10 w-full max-w-[520px] flex flex-col my-auto">
          {/* Top Action Header - Aligned directly with the card width */}
          {!hideTopRightAction && (
            <div className="flex items-center justify-end gap-3 mb-5 sm:mb-6">
              {topRightText && (
                <span className="text-slate-500 text-xs sm:text-sm font-normal font-['Inter',sans-serif]">
                  {topRightText}
                </span>
              )}
              {topRightButtonText && (
                topRightButtonHref ? (
                  <Link
                    to={topRightButtonHref}
                    onClick={onTopRightButtonClick}
                    className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-900 text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-lg transition-all duration-200 shadow-xs cursor-pointer text-decoration-none inline-flex items-center gap-1.5"
                  >
                    {topRightButtonText}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={onTopRightButtonClick}
                    className="bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-900 text-xs sm:text-sm font-semibold px-3.5 sm:px-4 py-2 rounded-lg transition-all duration-200 shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {topRightButtonText}
                  </button>
                )
              )}
            </div>
          )}

          {/* Dynamic Right Side Content (Form Card, Step Components, etc.) */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
