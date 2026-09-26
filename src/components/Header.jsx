import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../services/api";

const Header = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [userName, setUserName] = useState("Jyothsna");
  const [userInitial, setUserInitial] = useState("J");
  const dropdownRef = useRef(null);

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("authUser") ||
        sessionStorage.getItem("authUser") ||
        localStorage.getItem("user") ||
        sessionStorage.getItem("user");

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const name =
          parsed.name ||
          parsed.fullName ||
          (parsed.email ? parsed.email.split("@")[0] : "Jyothsna");
        setUserName(name);
        setUserInitial(name.charAt(0).toUpperCase() || "J");
      }
    } catch {
      // Keep default fallback
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setIsDropdownOpen(false);

    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsSigningOut(false);
      // Redirect to home page
      navigate("/");
    }
  };

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

      {/* User Profile & Dropdown */}
      <div ref={dropdownRef} className="relative ml-4 shrink-0">
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-[10px] cursor-pointer hover:opacity-90 transition-opacity bg-transparent border-none p-1 rounded-lg focus:outline-none"
        >
          {/* Avatar */}
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#E2E8F0]">
            <span className="text-[13px] font-semibold text-[#475569]">
              {userInitial}
            </span>
          </div>

          {/* Name */}
          <span className="text-[13px] font-medium text-[#1E293B]">
            {userName}
          </span>

          {/* Dropdown Arrow */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`text-[#64748B] transition-transform duration-150 ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-[180px] rounded-[14px] bg-white border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-[11px] font-medium text-slate-400">Signed in as</p>
              <p className="text-[13px] font-semibold text-slate-800 truncate">
                {userName}
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="mt-1 flex w-full items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer text-left disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-red-500"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;