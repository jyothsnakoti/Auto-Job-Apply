import React, { useState, useEffect } from "react";
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
import { getBillingStatus } from "../services/billingService";

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

const getInitialBillingState = () => {
  try {
    const raw =
      localStorage.getItem("billingStatus") ||
      sessionStorage.getItem("billingStatus");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore parse error
  }
  return null;
};

const Sidebar = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState(getInitialBillingState);
  const [isLoading, setIsLoading] = useState(!billing);
  const [isError, setIsError] = useState(false);

  const fetchStatus = async () => {
    try {
      if (!billing) {
        setIsLoading(true);
      }
      setIsError(false);
      const data = await getBillingStatus();
      if (data) {
        setBilling(data);
      }
    } catch (err) {
      console.warn("[Sidebar] Failed to load billing status:", err?.message);
      if (!billing) {
        setIsError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const handleBillingUpdate = (e) => {
      if (e?.detail) {
        setBilling(e.detail);
        setIsLoading(false);
        setIsError(false);
      } else {
        fetchStatus();
      }
    };

    window.addEventListener("billingStatusUpdated", handleBillingUpdate);
    window.addEventListener("storage", handleBillingUpdate);

    return () => {
      window.removeEventListener("billingStatusUpdated", handleBillingUpdate);
      window.removeEventListener("storage", handleBillingUpdate);
    };
  }, []);

  // Data mapping from backend billing status
  const hasPlan = Boolean(billing?.hasPlan);
  const planTitle = hasPlan
    ? (billing?.planName || "Active Plan")
    : "No active plan";
  const applicationAllowance =
    typeof billing?.applicationAllowance === "number"
      ? billing.applicationAllowance
      : 0;
  const usedApplications =
    typeof billing?.usedApplications === "number"
      ? billing.usedApplications
      : 0;
  const remainingApplications =
    typeof billing?.remainingApplications === "number"
      ? billing.remainingApplications
      : 0;
  const rawInterval = (billing?.billingInterval || "month").toLowerCase().trim();
  const intervalDisplay = rawInterval ? `applications/${rawInterval}` : "applications";

  const progress =
    applicationAllowance > 0
      ? (usedApplications / applicationAllowance) * 100
      : 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));

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
        {isLoading && !billing ? (
          /* Small Loading skeleton */
          <div className="rounded-[16px] border border-slate-200 bg-[#F8FAFC] p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] animate-pulse">
            <div className="h-3.5 w-24 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-200 rounded mb-3" />
            <div className="h-2 w-full bg-slate-200 rounded-full mb-2" />
            <div className="flex justify-between">
              <div className="h-2.5 w-12 bg-slate-200 rounded" />
              <div className="h-2.5 w-16 bg-slate-200 rounded" />
            </div>
          </div>
        ) : isError && !billing ? (
          /* Error state */
          <div className="rounded-[16px] border border-slate-200 bg-[#F8FAFC] p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <h3 className="text-[13px] font-semibold text-slate-800">
              Unable to load plan
            </h3>
            <p className="mt-[5px] text-[11px] text-[#64748B]">
              Please check connection
            </p>
            <button
              type="button"
              onClick={fetchStatus}
              className="mt-[11px] h-[34px] w-full rounded-[11px] bg-slate-200 hover:bg-slate-300 text-[12px] font-medium text-slate-700 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          /* Dynamic Plan Card */
          <div className="rounded-[16px] border border-slate-200 bg-[#F8FAFC] p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            
            {/* Plan title */}
            <h3 className="text-[13px] font-semibold text-slate-800">
              {planTitle}
            </h3>

            {/* Monthly / Quarter limit */}
            <p className="mt-[5px] text-[11px] text-[#64748B]">
              {hasPlan
                ? `${applicationAllowance} ${intervalDisplay}`
                : "0 applications remaining"}
            </p>

            {/* Progress bar */}
            <div className="mt-[10px] h-[8px] w-full overflow-hidden rounded-full bg-[#E2E8F0]">
              <div
                className="h-full rounded-full bg-[#4F46E5] transition-all duration-300"
                style={{ width: `${clampedProgress}%` }}
              />
            </div>

            {/* Usage */}
            <div className="mt-[7px] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                {usedApplications} used
              </span>

              <span className="text-[11px] text-[#64748B]">
                {remainingApplications} remaining
              </span>
            </div>

            {/* Upgrade Button */}
            <button
              type="button"
              onClick={() => navigate("/upgrade-plan")}
              className="mt-[11px] h-[40px] w-full rounded-[11px] bg-gradient-to-r from-[#4F46E5] to-[#2563EB] text-[13px] font-medium text-white transition-all duration-200 hover:brightness-105 active:scale-[0.99] cursor-pointer"
            >
              {hasPlan ? "Upgrade Plan" : "Choose Plan"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;