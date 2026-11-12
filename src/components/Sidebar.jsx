import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/Background.svg";

// Exact SVG icons configured with currentColor so they adapt to active (#4F46E5) and inactive (#64748B) states
const DashboardIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 18 16" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8.00313C17.9792 8.27396 17.875 8.50313 17.6875 8.69063C17.5 8.87813 17.2708 8.98229 17 9.00313H16L16.0312 14.0031C16.0104 14.0865 16 14.1698 16 14.2531V14.7531C16 15.1073 15.875 15.399 15.625 15.6281C15.3958 15.8781 15.1042 16.0031 14.75 16.0031H14.25C14.2083 16.0031 14.1771 16.0031 14.1562 16.0031C14.1146 16.0031 14.0729 16.0031 14.0312 16.0031H13H12.25C11.8958 16.0031 11.6042 15.8781 11.375 15.6281C11.125 15.399 11 15.1073 11 14.7531V14.0031V12.0031C11 11.7115 10.9062 11.4719 10.7188 11.2844C10.5312 11.0969 10.2917 11.0031 10 11.0031H8C7.70833 11.0031 7.46875 11.0969 7.28125 11.2844C7.09375 11.4719 7 11.7115 7 12.0031V14.0031V14.7531C7 15.1073 6.875 15.399 6.625 15.6281C6.39583 15.8781 6.10417 16.0031 5.75 16.0031H5H4C3.97917 16.0031 3.95833 16.0031 3.9375 16.0031C3.91667 16.0031 3.89583 16.0031 3.875 16.0031C3.83333 16.0031 3.79167 16.0031 3.75 16.0031H3.25C2.89583 16.0031 2.60417 15.8781 2.375 15.6281C2.125 15.399 2 15.1073 2 14.7531V11.2531C2 11.2323 2 11.201 2 11.1594V9.00313H1C0.708333 8.98229 0.46875 8.87813 0.28125 8.69063C0.09375 8.50313 0 8.27396 0 8.00313C0 7.71146 0.104167 7.46146 0.3125 7.25313L8.3125 0.253125C8.54167 0.065625 8.77083 -0.0177083 9 0.003125C9.25 0.003125 9.46875 0.0760417 9.65625 0.221875L17.6562 7.25313C17.9062 7.46146 18.0208 7.71146 18 8.00313Z" />
  </svg>
);

const FullTime1Icon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7 9H21C22.1046 9 23 9.89543 23 11V21C23 22.1046 22.1046 23 21 23H7C5.89543 23 5 22.1046 5 21V11C5 9.89543 5.89543 9 7 9Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
    <path
      d="M10 9V7C10 6.46957 10.2107 5.96086 10.5858 5.58579C10.9609 5.21071 11.4696 5 12 5H16C16.5304 5 17.0391 5.21071 17.4142 5.58579C17.7893 5.96086 18 6.46957 18 7V9M5 13C7.83072 14.2691 10.8978 14.9251 14 14.9251M14 14.9251C17.1022 14.9251 20.1693 14.2691 23 13M14 14.9251V13M14 14.9251V17"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
);

const AutoApplyIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M15.5625 0.189063C15.8958 0.418229 16.0417 0.741146 16 1.15781L14 14.1578C13.9375 14.4703 13.7708 14.7099 13.5 14.8766C13.2083 15.0224 12.9167 15.0328 12.625 14.9078L8.875 13.3766L6.75 15.6891C6.41667 16.0016 6.04167 16.0849 5.625 15.9391C5.22917 15.7516 5.02083 15.4391 5 15.0016V12.3766C5 12.2516 5.04167 12.1474 5.125 12.0641L10.375 6.34531C10.5417 6.11615 10.5312 5.88698 10.3438 5.65781C10.1354 5.47031 9.90625 5.4599 9.65625 5.62656L3.3125 11.2828L0.5625 9.90781C0.208333 9.72031 0.0208333 9.42865 0 9.03281C0 8.63698 0.166667 8.3349 0.5 8.12656L14.5 0.126563C14.875 -0.0609375 15.2292 -0.0401042 15.5625 0.189063Z" />
  </svg>
);

const FullTime2Icon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M11 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V11M3 11V9C3 8.46957 3.21071 7.96086 3.58579 7.58579C3.96086 7.21071 4.46957 7 5 7H8M3 11C5.82507 12.2948 8.89241 12.9765 12 13M8 7H16M8 7V5C8 4.46957 8.21071 3.96086 8.58579 3.58579C8.96086 3.21071 9.46957 3 10 3H14C14.5304 3 15.0391 3.21071 15.4142 3.58579C15.7893 3.96086 16 4.46957 16 5V7M16 7H19C19.5304 7 20.0391 7.21071 20.4142 7.58579C20.7893 7.96086 21 8.46957 21 9V11M18 12L14 18H18L17 23L22 16H18V12Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
);

const C2CIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 28 28" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 23H6V7C6 6.46957 6.21071 5.96086 6.58579 5.58579C6.96086 5.21071 7.46957 5 8 5H16C16.5304 5 17.0391 5.21071 17.4142 5.58579C17.7893 5.96086 18 6.46957 18 7V12M10 9H14M10 13H13M10 17H12M20 14L16 20H20L19 25L24 18H20V14Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
);

const C2C1Icon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 21V5C4 4.46957 4.21071 3.96086 4.58579 3.58579C4.96086 3.21071 5.46957 3 6 3H14C14.5304 3 15.0391 3.21071 15.4142 3.58579C15.7893 3.96086 16 4.46957 16 5V9M4 21H3M4 21H9M16 9V21M16 9H19C19.5304 9 20.0391 9.21071 20.4142 9.58579C20.7893 9.96086 21 10.4696 21 11V21M16 21H11M16 21H21M21 21H22M9 21H11M9 21V19H11V21M8 7H12M8 11H12M8 15H12"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
);

const TrackerIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 14 14" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M5 1.5C5.02083 1.08333 5.16667 0.729167 5.4375 0.4375C5.72917 0.166667 6.08333 0.0208333 6.5 0H7.5C7.91667 0.0208333 8.27083 0.166667 8.5625 0.4375C8.83333 0.729167 8.97917 1.08333 9 1.5V12.5C8.97917 12.9167 8.83333 13.2708 8.5625 13.5625C8.27083 13.8333 7.91667 13.9792 7.5 14H6.5C6.08333 13.9792 5.72917 13.8333 5.4375 13.5625C5.16667 13.2708 5.02083 12.9167 5 12.5V1.5ZM0 7.5C0.0208333 7.08333 0.166667 6.72917 0.4375 6.4375C0.729167 6.16667 1.08333 6.02083 1.5 6H2.5C2.91667 6.02083 3.27083 6.16667 3.5625 6.4375C3.83333 6.72917 3.97917 7.08333 4 7.5V12.5C3.97917 12.9167 3.83333 13.2708 3.5625 13.5625C3.27083 13.8333 2.91667 13.9792 2.5 14H1.5C1.08333 13.9792 0.729167 13.8333 0.4375 13.5625C0.166667 13.2708 0.0208333 12.9167 0 12.5V7.5ZM11.5 2H12.5C12.9167 2.02083 13.2708 2.16667 13.5625 2.4375C13.8333 2.72917 13.9792 3.08333 14 3.5V12.5C13.9792 12.9167 13.8333 13.2708 13.5625 13.5625C13.2708 13.8333 12.9167 13.9792 12.5 14H11.5C11.0833 13.9792 10.7292 13.8333 10.4375 13.5625C10.1667 13.2708 10.0208 12.9167 10 12.5V3.5C10.0208 3.08333 10.1667 2.72917 10.4375 2.4375C10.7292 2.16667 11.0833 2.02083 11.5 2Z" />
  </svg>
);

const ProfileIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 14 16" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 4C9.47917 3.0625 9.0625 2.34375 8.25 1.84375C7.41667 1.38542 6.58333 1.38542 5.75 1.84375C4.9375 2.34375 4.52083 3.0625 4.5 4C4.52083 4.9375 4.9375 5.65625 5.75 6.15625C6.58333 6.61458 7.41667 6.61458 8.25 6.15625C9.0625 5.65625 9.47917 4.9375 9.5 4ZM3 4C3 3.27083 3.17708 2.60417 3.53125 2C3.88542 1.39583 4.375 0.90625 5 0.53125C5.625 0.177083 6.29167 0 7 0C7.70833 0 8.375 0.177083 9 0.53125C9.625 0.90625 10.1146 1.39583 10.4688 2C10.8229 2.60417 11 3.27083 11 4C11 4.72917 10.8229 5.39583 10.4688 6C10.1146 6.60417 9.625 7.09375 9 7.46875C8.375 7.82292 7.70833 8 7 8C6.29167 8 5.625 7.82292 5 7.46875C4.375 7.09375 3.88542 6.60417 3.53125 6C3.17708 5.39583 3 4.72917 3 4ZM1.53125 14.5H12.4688C12.3021 13.4792 11.8542 12.6458 11.125 12C10.375 11.3542 9.47917 11.0208 8.4375 11H5.5625C4.52083 11.0208 3.63542 11.3542 2.90625 12C2.15625 12.6458 1.69792 13.4792 1.53125 14.5ZM0 15.0625C0.0416667 13.5 0.583333 12.1875 1.625 11.125C2.6875 10.0833 4 9.54167 5.5625 9.5H8.4375C10 9.54167 11.3125 10.0833 12.375 11.125C13.4167 12.1875 13.9583 13.5 14 15.0625C14 15.3333 13.9062 15.5521 13.7188 15.7188C13.5521 15.9062 13.3333 16 13.0625 16H0.9375C0.666667 16 0.447917 15.9062 0.28125 15.7188C0.09375 15.5521 0 15.3333 0 15.0625Z" />
  </svg>
);

const SubscriptionIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 16 16" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.8 6.5998V3.2998C13.8 2.90198 13.6419 2.52045 13.3606 2.23914C13.0793 1.95784 12.6978 1.7998 12.3 1.7998H2.19995C2.00297 1.7998 1.80791 1.8386 1.62593 1.91399C1.44394 1.98937 1.27858 2.09986 1.13929 2.23914C0.857986 2.52045 0.699951 2.90198 0.699951 3.2998V9.2998C0.699951 9.69763 0.857986 10.0792 1.13929 10.3605C1.27858 10.4998 1.44394 10.6102 1.62593 10.6856C1.80791 10.761 2.00297 10.7998 2.19995 10.7998H5.39995"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
    <path
      d="M0.699951 4.7998H13.8M2.79995 7.9998H5.09995"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
    <path
      d="M13.2999 10.0996C12.9276 9.52152 12.3708 9.08622 11.72 8.86433C11.0692 8.64245 10.3625 8.64699 9.71453 8.87724C9.0666 9.10748 8.51549 9.54991 8.15062 10.1327C7.78574 10.7156 7.62852 11.4046 7.70445 12.088C7.78038 12.7714 8.08502 13.4091 8.56894 13.8976C9.05285 14.3861 9.68764 14.6968 10.3703 14.7792C11.053 14.8616 11.7434 14.7109 12.3297 14.3516C12.9159 13.9922 13.3636 13.4453 13.5999 12.7996"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
    <path
      d="M13.2999 7.89941V10.0994H11.0999"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
    />
  </svg>
);

const SettingsIcon = ({ className = "h-5 w-5" }) => (
  <svg viewBox="0 0 16 16" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M15.0357 5.21875C15.119 5.51042 15.0565 5.76042 14.8482 5.96875L13.4732 7.21875C13.5149 7.46875 13.5357 7.72917 13.5357 8C13.5357 8.27083 13.5149 8.53125 13.4732 8.78125L14.8482 10.0312C15.0565 10.2396 15.119 10.4896 15.0357 10.7812C14.8899 11.1562 14.7232 11.5208 14.5357 11.875L14.3795 12.125C14.1711 12.4583 13.942 12.7812 13.692 13.0938C13.4836 13.3229 13.2336 13.3958 12.942 13.3125L11.192 12.75C10.7753 13.0833 10.317 13.3438 9.81696 13.5312L9.44196 15.3438C9.35863 15.6354 9.16071 15.8125 8.84821 15.875C8.43155 15.9583 7.99405 16 7.53571 16C7.07738 16 6.62946 15.9583 6.19196 15.875C5.9003 15.8125 5.7128 15.6354 5.62946 15.3438L5.25446 13.5312C4.75446 13.3438 4.29613 13.0833 3.87946 12.75L2.12946 13.3125C1.8378 13.3958 1.5878 13.3229 1.37946 13.0938C1.10863 12.7812 0.879464 12.4583 0.691964 12.125L0.535714 11.875C0.348214 11.5208 0.181548 11.1667 0.0357143 10.8125C-0.047619 10.5 0.014881 10.2396 0.223214 10.0312L1.59821 8.8125C1.55655 8.54167 1.53571 8.27083 1.53571 8C1.53571 7.72917 1.55655 7.46875 1.59821 7.21875L0.223214 5.96875C0.014881 5.76042 -0.047619 5.51042 0.0357143 5.21875C0.181548 4.84375 0.348214 4.47917 0.535714 4.125L0.691964 3.875C0.879464 3.54167 1.10863 3.21875 1.37946 2.90625C1.5878 2.67708 1.8378 2.60417 2.12946 2.6875L3.87946 3.25C4.29613 2.91667 4.75446 2.64583 5.25446 2.4375L5.62946 0.65625C5.7128 0.364583 5.91071 0.1875 6.22321 0.125C6.63988 0.0416667 7.07738 0 7.53571 0C7.99405 0 8.44196 0.0416667 8.87946 0.125C9.17113 0.1875 9.35863 0.364583 9.44196 0.65625L9.81696 2.4375C10.317 2.64583 10.7753 2.91667 11.192 3.25L12.942 2.6875C13.2336 2.60417 13.4836 2.67708 13.692 2.90625C13.9628 3.21875 14.2024 3.54167 14.4107 3.875L14.5357 4.125C14.7232 4.47917 14.8899 4.84375 15.0357 5.21875ZM7.53571 10.5C8.47321 10.4792 9.19196 10.0625 9.69196 9.25C10.1503 8.41667 10.1503 7.58333 9.69196 6.75C9.19196 5.9375 8.47321 5.52083 7.53571 5.5C6.59821 5.52083 5.87946 5.9375 5.37946 6.75C4.92113 7.58333 4.92113 8.41667 5.37946 9.25C5.87946 10.0625 6.59821 10.4792 7.53571 10.5Z" />
  </svg>
);

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: DashboardIcon,
  },
  {
    name: "Full Time Apply One At A Time",
    path: "/browse-jobs",
    icon: FullTime1Icon,
  },
  {
    name: "Full Time Bulk Apply ",
    path: "/auto-apply",
    icon: AutoApplyIcon,
  },
  {
    name: "Full Time Auto Select Auto Apply",
    path: "/full-time-auto-apply",
    icon: FullTime2Icon,
  },
  {
    name: "C2C One At A Time",
    path: "/c2c-jobs",
    icon: C2CIcon,
  },
  {
    name: "C2C Auto Select Auto Apply",
    path: "/c2c-auto-apply",
    icon: C2C1Icon,
  },
  {
    name: "Tracker",
    path: "/tracker",
    icon: TrackerIcon,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: ProfileIcon,
  },
  {
    name: "My Subscriptions",
    path: "/subscriptions",
    icon: SubscriptionIcon,
  },

];

const Sidebar = () => {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Handle mobile toggle events and window resize
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleOpen = () => setIsMobileOpen(true);
    const handleClose = () => setIsMobileOpen(false);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("toggleMobileSidebar", handleToggle);
    window.addEventListener("openMobileSidebar", handleOpen);
    window.addEventListener("closeMobileSidebar", handleClose);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("toggleMobileSidebar", handleToggle);
      window.removeEventListener("openMobileSidebar", handleOpen);
      window.removeEventListener("closeMobileSidebar", handleClose);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-[320px] min-w-[320px] shrink-0 flex flex-col border-r border-slate-100 bg-white px-5 sm:px-6 py-5 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden transform transition-transform duration-450 ease-in-out lg:static lg:translate-x-0 lg:z-30 ${isMobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0 shadow-none"
          }`}
      >
        {/* Logo / Brand + Mobile Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <img
              src={logo}
              alt="Meow Meow Jobs"
              className="h-8 w-8 rounded-[7px] object-contain"
            />

            <span className="whitespace-nowrap text-[21px] sm:text-[22px] font-medium tracking-[-0.4px] text-[#004B97]">
              Meow Meow Jobs
            </span>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-[28px] flex flex-col gap-[5px]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/"}
                onClick={() => setIsMobileOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex min-h-[40px] w-full items-center gap-[13px] whitespace-nowrap rounded-[8px] px-[10px]",
                    "text-[15px] font-normal",
                    "transition-all duration-150",

                    isActive
                      ? "bg-[#EEF2FF] text-[#4F46E5]"
                      : "text-[#64748B] hover:bg-slate-50",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`shrink-0 ${item.name.trim() === "Full Time Bulk Apply" ||
                          item.name.trim() === "Bulk Full Time Apply"
                          ? "h-[17px] w-[17px]"
                          : "h-[20px] w-[20px]"
                        } ${isActive ? "text-[#4F46E5]" : "text-[#64748B]"}`}
                    />

                    <span className="whitespace-nowrap">{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
