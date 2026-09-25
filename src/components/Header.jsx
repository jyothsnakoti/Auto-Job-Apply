import React from "react";

const Header = () => {
  return (
    <header className="sticky top-0 z-20 flex h-[70px] w-full shrink-0 items-center justify-between bg-white border-b border-[#F1F5F9] px-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
      {/* Search Bar */}
      <div className="flex h-[40px] w-full max-w-[540px] items-center gap-2.5 rounded-full border border-[#E2E8F0] bg-white px-4 focus-within:border-slate-400 transition-colors">
        {/* Search Icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 text-[#94A3B8]"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>

        <input
          type="text"
          placeholder="Search jobs, companies, skills, or keywords..."
          className="w-full min-w-0 border-0 bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-[#94A3B8]"
        />
      </div>

      {/* User Profile */}
      <div className="ml-4 flex shrink-0 items-center gap-[10px] cursor-pointer hover:opacity-90 transition-opacity">
        {/* Avatar */}
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#E2E8F0]">
          <span className="text-[13px] font-semibold text-[#475569]">
            J
          </span>
        </div>

        {/* Name */}
        <span className="text-[13px] font-medium text-[#1E293B]">
          Jyothsna
        </span>

        {/* Dropdown */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-[#64748B]"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </header>
  );
};

export default Header;