import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/Background.svg";
import dashboardIcon from "../assets/dashboard.svg";
import browseJobsIcon from "../assets/search.svg";
import autoApplyIcon from "../assets/auto apply.svg";
import profileIcon from "../assets/profile.svg";
import subscriptionIcon from "../assets/Subscription.svg";
import settingsIcon from "../assets/settings.svg";
import dashboardActiveIcon from "../assets/Home1.png";
import browseJobsActiveIcon from "../assets/search1.png";
import autoApplyActiveIcon from "../assets/apply1.png";
import profileActiveIcon from "../assets/profile1.png";
import subscriptionActiveIcon from "../assets/Subscription1.svg";
import settingsActiveIcon from "../assets/settings1.png";
import FullTime1 from "../assets/FullTime1.svg";
import FullTime2 from "../assets/FullTime2.svg";
import C2C from "../assets/C2C.svg";
import C2C1 from "../assets/C2C1.svg";
import fulltimeone from "../assets/fulltimeone.svg";
import fulltimetwo from "../assets/fulltimetwo.svg";
import fulltimethree from "../assets/fulltimethree.svg";
import fulltimefour from "../assets/fulltimefour.svg";
import fulltimefive from "../assets/fulltimefive.svg";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: dashboardIcon,
    activeIcon: dashboardActiveIcon,
  },
  {
    name: "Full Time Apply One At A Time",
    path: "/browse-jobs",
    icon: FullTime1,
    activeIcon: fulltimeone,
  },
   {
    name: "Full Time Bulk Apply ",
    path: "/auto-apply",
    icon: autoApplyIcon,
    activeIcon: fulltimetwo,
  },
  {
    name: "Full Time Auto Select Auto Apply",
    path: "/full-time-auto-apply",
    icon: FullTime2,
    activeIcon: fulltimethree,
  },
 
  {
    name: "C2C One At A Time",
    path: "/c2c-jobs",
    icon: C2C,
    activeIcon: fulltimefour,
  },
  {
    name: "C2C Auto Select Auto Apply",
    path: "/c2c-auto-apply",
    icon: C2C1,
    activeIcon: fulltimefive,
  },
  
  {
    name: "Profile",
    path: "/profile",
    icon: profileIcon,
    activeIcon: profileActiveIcon,
  },
  {
    name: "My Subscriptions",
    path: "/subscriptions",
    icon: subscriptionIcon,
    activeIcon: subscriptionActiveIcon,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: settingsIcon,
    activeIcon: settingsActiveIcon,
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
        className={`fixed inset-y-0 left-0 z-50 h-screen w-[320px] min-w-[320px] shrink-0 flex flex-col border-r border-slate-100 bg-white px-5 sm:px-6 py-5 overflow-y-auto transform transition-transform duration-450 ease-in-out lg:static lg:translate-x-0 lg:z-30 ${
          isMobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0 shadow-none"
        }`}
      >
        {/* Logo / Brand + Mobile Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <img
              src={logo}
              alt="Auto Jobs Apply"
              className="h-8 w-8 rounded-[7px] object-contain"
            />

            <span className="whitespace-nowrap text-[21px] sm:text-[22px] font-medium tracking-[-0.4px] text-[#004B97]">
              Auto Jobs Apply
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
          {navigationItems.map((item) => (
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
                 <img
  src={isActive ? item.activeIcon : item.icon}
  alt=""
  className={`shrink-0 object-contain ${
    item.name === "Bulk Full Time Apply"
      ? "h-[17px] w-[17px]" 
      : "h-[20px] w-[20px]"
  }`}
/>

                  <span className="whitespace-nowrap">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

      </aside>
    </>
  );
};

export default Sidebar;