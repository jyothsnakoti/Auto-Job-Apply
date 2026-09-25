import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/Background.svg";
import dashboardIcon from "../assets/dashboard.svg";
import browseJobsIcon from "../assets/search.svg";
import autoApplyIcon from "../assets/auto apply.svg";
import trackerIcon from "../assets/tracker.svg";
import profileIcon from "../assets/profile.svg";
import settingsIcon from "../assets/settings.svg";
import dashboardActiveIcon from "../assets/Home1.png";
import browseJobsActiveIcon from "../assets/search1.png";
import autoApplyActiveIcon from "../assets/apply1.png";
import trackerActiveIcon from "../assets/Tracker1.png";
import profileActiveIcon from "../assets/profile1.png";
import settingsActiveIcon from "../assets/settings1.png";

const navigationItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: dashboardIcon,
    activeIcon: dashboardActiveIcon,
  },
  {
    name: "Browse Jobs",
    path: "/browse-jobs",
    icon: browseJobsIcon,
    activeIcon: browseJobsActiveIcon,
  },
  {
    name: "Auto Apply",
    path: "/auto-apply",
    icon: autoApplyIcon,
    activeIcon: autoApplyActiveIcon,
  },
  {
    name: "Tracker",
    path: "/tracker",
    icon: trackerIcon,
    activeIcon: trackerActiveIcon,
  },
  {
    name: "Profile",
    path: "/profile",
    icon: profileIcon,
    activeIcon: profileActiveIcon,
  },
  {
    name: "Settings",
    path: "/settings",
    icon: settingsIcon,
    activeIcon: settingsActiveIcon,
  },
];

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 h-screen w-[264px] shrink-0 flex flex-col border-r border-slate-100 bg-white px-6 py-5 z-30 overflow-y-auto">
      
      {/* Logo / Brand */}
      <div className="flex items-center gap-[10px]">
        <img
          src={logo}
          alt="Auto Jobs Apply"
          className="h-8 w-8 rounded-[7px] object-contain"
        />

        <span className="whitespace-nowrap text-[22px] font-medium tracking-[-0.4px] text-[#004B97]">
          Auto Jobs Apply
        </span>
      </div>

      {/* Navigation */}
      <nav className="mt-[28px] flex flex-col gap-[5px]">
        {navigationItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              [
                "flex h-[40px] items-center gap-[13px] rounded-[8px] px-[10px]",
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
                  className="h-[20px] w-[20px] shrink-0 object-contain"
                />

                <span>{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Plan Card */}
      <div className="mt-auto pt-6 shrink-0">
        <div className="rounded-[16px] border border-slate-200 bg-[#F8FAFC] p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          
          {/* Plan title */}
          <h3 className="text-[13px] font-semibold text-slate-800">
            Basic Plan
          </h3>

          {/* Monthly limit */}
          <p className="mt-[5px] text-[11px] text-[#64748B]">
            250 applications/month
          </p>

          {/* Progress bar */}
          <div className="mt-[10px] h-[8px] w-full overflow-hidden rounded-full bg-[#E2E8F0]">
            <div
              className="h-full rounded-full bg-[#4F46E5]"
              style={{ width: "59.2%" }}
            />
          </div>

          {/* Usage */}
          <div className="mt-[7px] flex items-center justify-between">
            <span className="text-[11px] text-[#64748B]">
              148 used
            </span>

            <span className="text-[11px] text-[#64748B]">
              102 remaining
            </span>
          </div>

          {/* Upgrade Button */}
          <button
            type="button"
            onClick={() => navigate("/upgrade-plan")}
            className="mt-[11px] h-[40px] w-full rounded-[11px] bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-[13px] font-medium text-white transition-all duration-200 hover:brightness-105 active:scale-[0.99] cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;