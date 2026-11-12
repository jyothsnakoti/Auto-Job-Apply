import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Layers, Gem, ChevronDown, ChevronUp } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  getBillingStatus,
  getBillingPlans,
  getBillingHistory,
  toggleAutopay,
} from "../services/billingService";

const CheckIcon = () => (
  <svg
    className="w-4 h-4 text-[#059669] shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const UpgradePlan = () => {
  const navigate = useNavigate();
  const [autoPay, setAutoPay] = useState(false);
  const [isTogglingAutoPay, setIsTogglingAutoPay] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [backendPlans, setBackendPlans] = useState([]);
  const [showAllPlans, setShowAllPlans] = useState(false);

  // Auto-dismiss toast after 3.5 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Billing history state
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  // Billing status state from API / storage
  const [billing, setBilling] = useState(() => {
    try {
      const raw =
        localStorage.getItem("billingStatus") ||
        sessionStorage.getItem("billingStatus");
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  });

  // Handle Auto-pay Toggle with Backend Sync & Toast Notification
  const handleToggleAutoPay = async () => {
    if (isTogglingAutoPay) return;
    const nextState = !autoPay;
    setIsTogglingAutoPay(true);
    setAutoPay(nextState);

    try {
      await toggleAutopay(nextState);
      setToast({
        show: true,
        message: nextState ? "Auto-pay turned ON successfully" : "Auto-pay turned OFF successfully",
        type: "success",
      });
      setBilling((prev) => (prev ? { ...prev, autoRenew: nextState, autoPay: nextState } : prev));
    } catch (err) {
      console.warn("[UpgradePlan] toggleAutopay local sync:", err);
      setToast({
        show: true,
        message: nextState ? "Auto-pay turned ON" : "Auto-pay turned OFF",
        type: "success",
      });
    } finally {
      setIsTogglingAutoPay(false);
    }
  };

  // Fetch billing history
  const fetchBillingHistory = async () => {
    try {
      setIsHistoryLoading(true);
      setHistoryError("");
      const data = await getBillingHistory();
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.warn("[UpgradePlan] Failed to fetch billing history:", err);
      setHistoryError(err.message || "Unable to load billing history.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    const fetchStatusAndPlans = async () => {
      try {
        const data = await getBillingStatus();
        if (data) setBilling(data);
      } catch (err) {
        console.warn("[UpgradePlan] Failed to fetch billing status:", err);
      }

      try {
        const plans = await getBillingPlans();
        if (Array.isArray(plans)) {
          setBackendPlans(plans);
        }
      } catch (plansErr) {
        console.debug("[UpgradePlan] Could not load backend plans:", plansErr);
      }
    };

    fetchStatusAndPlans();
    fetchBillingHistory();

    const handleBillingUpdate = (e) => {
      if (e?.detail) setBilling(e.detail);
      else fetchStatusAndPlans();
      fetchBillingHistory();
    };

    window.addEventListener("billingStatusUpdated", handleBillingUpdate);
    window.addEventListener("storage", handleBillingUpdate);
    return () => {
      window.removeEventListener("billingStatusUpdated", handleBillingUpdate);
      window.removeEventListener("storage", handleBillingUpdate);
    };
  }, []);

  // Formatters for Billing History
  const formatBillingDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatPlanName = (code) => {
    if (!code) return "—";
    const c = String(code).toLowerCase().trim();
    if (c === "pro") return "Pro";
    if (c === "basic") return "Basic";
    if (c === "trial") return "Trial Pack";
    return code.charAt(0).toUpperCase() + code.slice(1);
  };

  const formatAmount = (amountCents, currency = "usd") => {
    if (typeof amountCents !== "number") return "$0.00";
    const symbol = currency?.toLowerCase() === "usd" ? "$" : "$";
    return `${symbol}${(amountCents / 100).toFixed(2)}`;
  };

  const formatStatusBadge = (status) => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "succeeded" || s === "paid") {
      return {
        label: "Paid",
        className: "bg-[#ECFDF5] text-[#059669]",
      };
    }
    if (s === "pending") {
      return {
        label: "Pending",
        className: "bg-[#FEF3C7] text-[#D97706]",
      };
    }
    if (s === "failed") {
      return {
        label: "Failed",
        className: "bg-[#FEF2F2] text-[#DC2626]",
      };
    }
    return {
      label: status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown",
      className: "bg-slate-100 text-slate-700",
    };
  };

  // Extract dynamic fields from GET /api/billing/status
  const hasPlan = Boolean(billing?.hasPlan);
  const rawPlanName = (billing?.planName || "").trim();

  // Normalize current plan classification
  let currentPlanKey = "trial";
  if (rawPlanName.toLowerCase().includes("pro")) {
    currentPlanKey = "pro";
  } else if (rawPlanName.toLowerCase().includes("basic")) {
    currentPlanKey = "basic";
  } else {
    currentPlanKey = "trial";
  }

  const isProActive = currentPlanKey === "pro";
  const isBasicActive = currentPlanKey === "basic";
  const isTrialActive = currentPlanKey === "trial";

  const planTitle = rawPlanName || (hasPlan ? "Active Plan" : "Trial Pack");
  const applicationAllowance =
    typeof billing?.applicationAllowance === "number"
      ? billing.applicationAllowance
      : isProActive
        ? 1000
        : isBasicActive
          ? 250
          : 5;
  const usedApplications =
    typeof billing?.usedApplications === "number"
      ? billing.usedApplications
      : 0;
  const remainingApplications =
    typeof billing?.remainingApplications === "number"
      ? billing.remainingApplications
      : Math.max(0, applicationAllowance - usedApplications);
  const isExhausted = remainingApplications === 0;

  const rawInterval = (billing?.billingInterval || (isProActive ? "quarter" : isBasicActive ? "month" : "none"))
    .toLowerCase()
    .trim();
  const intervalDisplay =
    rawInterval && rawInterval !== "none" && rawInterval !== "null"
      ? `applications / ${rawInterval}`
      : "applications";

  const progress =
    applicationAllowance > 0
      ? (usedApplications / applicationAllowance) * 100
      : 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Seed / Standard plan blueprints matching /plan page
  const allPlanTemplates = [
    {
      code: "trial",
      name: "Trial Pack",
      priceCents: 0,
      price: 0,
      billingInterval: "none",
      applicationAllowance: 5,
      subtitle: "Free trial to get started",
      features: [
        "Job discovery & matching",
        "ATS matching",
        "Resume tailoring",
        "Automated applications",
        "Application tracking",
        "Dashboard & insights",
      ],
    },
    {
      code: "basic",
      name: "Basic Plan",
      priceCents: 499,
      price: 4.99,
      billingInterval: "month",
      applicationAllowance: 250,
      subtitle: "Great for getting started",
      features: [
        "Job discovery & matching",
        "ATS matching",
        "Resume tailoring",
        "Automated applications",
        "Application tracking",
        "Dashboard & insights",
      ],
    },
    {
      code: "pro",
      name: "Pro Plan",
      priceCents: 1299,
      price: 12.99,
      billingInterval: "quarter",
      applicationAllowance: 1000,
      isPopular: true,
      subtitle: "Best for active job seekers",
      features: [
        "Job discovery & matching",
        "ATS matching",
        "Resume tailoring",
        "Automated applications",
        "Application tracking",
        "Priority job matching",
        "Dashboard & insights",
      ],
    },
  ];

  // Merge seed blueprints with live data from GET /api/billing/plans
  const mergedPlans = allPlanTemplates.map((template) => {
    const backendMatch = backendPlans.find(
      (bp) =>
        bp.code?.toLowerCase() === template.code ||
        bp.name?.toLowerCase().includes(template.code)
    );
    if (backendMatch) {
      return {
        ...template,
        ...backendMatch,
        price: backendMatch.priceCents ? backendMatch.priceCents / 100 : template.price,
        name: backendMatch.name || template.name,
      };
    }
    return template;
  });

  // Filter visible plans based on current active plan & Pro "Show All" toggle:
  // - Trial Pack active -> [ Trial Pack, Basic Plan, Pro Plan ]
  // - Basic Plan active -> [ Basic Plan, Pro Plan ]
  // - Pro Plan active   -> [ Pro Plan ] by default; [ Basic Plan, Pro Plan ] when Show All is clicked
  const visiblePlans = isProActive
    ? showAllPlans
      ? mergedPlans.filter((p) => p.code === "basic" || p.code === "pro")
      : mergedPlans.filter((p) => p.code === "pro")
    : isBasicActive
      ? mergedPlans.filter((p) => p.code === "basic" || p.code === "pro")
      : mergedPlans;

  const handleSelectPaidPlan = (plan) => {
    const plancode = plan.code.toLowerCase();
    const name = plan.name || (plancode === "pro" ? "Pro Plan" : "Basic Plan");
    const priceCents = plan.priceCents || (plancode === "pro" ? 1299 : 499);
    const price = priceCents / 100;
    const billingInterval = plan.billingInterval || (plancode === "pro" ? "quarter" : "month");
    const allowance = plan.applicationAllowance || (plancode === "pro" ? 1000 : 250);

    navigate("/payment", {
      state: {
        planId: plan.id,
        name: name,
        code: plancode,
        price: price,
        priceCents: priceCents,
        billing: `/ ${billingInterval}`,
        billingInterval: billingInterval,
        applications: `Up to ${allowance} applications`,
        applicationAllowance: allowance,
      },
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Upgrade Plan Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
              {isExhausted
                ? "Renew or Upgrade Your Plan"
                : isProActive
                  ? "Manage Plan & Subscription"
                  : isBasicActive
                    ? "Upgrade Your Plan"
                    : "Upgrade Plan"}
            </h1>
            <p className="text-[13px] text-[#64748B]">
              {isExhausted
                ? "Your application credits are exhausted. Choose a plan below to replenish your quota and continue applying."
                : isProActive
                  ? "You are on the Pro tier. View your active application quota and account billing details."
                  : isBasicActive
                    ? "Upgrade to Pro Plan for 1,000 applications/quarter and priority AI ATS matching."
                    : "Choose a plan that fits your job search needs. Get higher application limits and unlock advanced features."}
            </p>
          </div>

          {/* Top Row: Current Plan Status & Dynamic Alert Box */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex items-center justify-between gap-6 flex-wrap">
            {/* Left: Plan Info + Progress Bar */}
            <div className="flex items-center gap-6 flex-wrap flex-1 min-w-[300px]">
              {/* Crown Icon Box + Info */}
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0 ${isProActive
                      ? "bg-[#F3E8FF] text-[#7C3AED]"
                      : isBasicActive
                        ? "bg-[#EFF6FF] text-[#2563EB]"
                        : "bg-[#FEF3C7] text-[#D97706]"
                    }`}
                >
                  {isProActive ? (
                    <Gem className="w-5 h-5 text-[#7C3AED]" />
                  ) : isBasicActive ? (
                    <Layers className="w-5 h-5 text-[#2563EB]" />
                  ) : (
                    <Crown className="w-5 h-5 text-[#D97706]" />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    CURRENT PLAN
                  </span>
                  <span className="text-[16.5px] font-bold text-[#0F172A] leading-tight">
                    {planTitle}
                  </span>
                  <span className="text-[12px] text-[#64748B] mt-0.5">
                    {`${applicationAllowance} ${intervalDisplay}`}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-[320px]">
                <div className="w-full h-[7px] bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isExhausted
                        ? "bg-[#EF4444]"
                        : "bg-[#10B981]"
                      }`}
                    style={{ width: `${clampedProgress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11.5px] text-[#64748B]">
                  <span>{usedApplications} used</span>
                  <span className={isExhausted ? "font-semibold text-[#DC2626]" : ""}>
                    {remainingApplications} remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Dynamic Contextual Alert Box */}
            <div
              className={`rounded-[16px] p-4 flex items-start gap-3 max-w-[440px] border ${isExhausted
                  ? "bg-[#FEF2F2] border-[#FECACA]"
                  : isProActive
                    ? "bg-[#F5F3FF] border-[#DDD6FE]"
                    : "bg-[#FEFCE8] border-[#FEF08A]"
                }`}
            >
              <div
                className={`w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 ${isExhausted
                    ? "bg-[#FEE2E2] text-[#DC2626]"
                    : isProActive
                      ? "bg-[#EDE9FE] text-[#7C3AED]"
                      : "bg-[#FEF08A] text-[#854D0E]"
                  }`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-[13px] font-bold ${isExhausted
                      ? "text-[#DC2626]"
                      : isProActive
                        ? "text-[#6D28D9]"
                        : "text-[#854D0E]"
                    }`}
                >
                  {isExhausted
                    ? "Application Credits Exhausted"
                    : isProActive
                      ? "Top Tier Active"
                      : "Need more applications?"}
                </span>
                <p
                  className={`text-[12px] mt-0.5 leading-snug ${isExhausted
                      ? "text-[#991B1B]"
                      : isProActive
                        ? "text-[#6D28D9]"
                        : "text-[#A16207]"
                    }`}
                >
                  {isExhausted
                    ? "You have 0 remaining applications. Choose a plan to replenish your application allowance."
                    : isProActive
                      ? "You are currently on our highest tier with 1,000 applications per quarter."
                      : isBasicActive
                        ? "Upgrade to Pro to get 1,000 applications/quarter and priority AI job matching."
                        : "Upgrade to increase your application quota and keep your job search momentum going."}
                </p>
              </div>
            </div>
          </div>

          {/* Main Section: Plan Cards & Billing Management */}
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-[16px] font-bold text-[#0F172A]">
              {isProActive
                ? showAllPlans
                  ? "Available Plans"
                  : "Current Plan"
                : isExhausted || isBasicActive
                  ? "Available Plans"
                  : "Select a Plan"}
            </h2>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
              {/* Left Column(s): Filtered Plan Cards + Show All Toggle for Pro Plan */}
              <div
                className={`flex flex-col gap-4 w-full ${visiblePlans.length === 1
                    ? "xl:col-span-6 max-w-[480px]"
                    : "xl:col-span-8"
                  }`}
              >
                <div
                  className={`grid gap-6 items-stretch ${visiblePlans.length === 3
                      ? "grid-cols-1 md:grid-cols-3"
                      : visiblePlans.length === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1"
                    }`}
                >
                  {visiblePlans.map((plan) => {
                    const isCurrent = plan.code === currentPlanKey;
                    const isPro = plan.code === "pro";
                    const isFree = plan.priceCents === 0 || !plan.priceCents;
                    const priceText = isFree
                      ? "Free"
                      : `$${(plan.priceCents / 100).toFixed(2)}`;
                    const periodText =
                      plan.billingInterval &&
                        plan.billingInterval !== "none" &&
                        plan.billingInterval !== "null"
                        ? `/ ${plan.billingInterval}`
                        : "";
                    const limitText = plan.applicationAllowance
                      ? `${plan.applicationAllowance} applications ${periodText ? periodText : ""}`
                      : "";

                    const cardStyle =
                      plan.code === "trial"
                        ? "bg-[#FEF9C3] border-2 border-[#FDE68A]"
                        : plan.code === "basic"
                          ? `bg-[#EFF6FF] border-2 ${isCurrent ? "border-[#BFDBFE]" : "border-[#BFDBFE] hover:border-[#60A5FA]"}`
                          : plan.code === "pro"
                            ? `bg-[#F5F3FF] border-2 ${isCurrent ? "border-[#DDD6FE]" : "border-[#DDD6FE] hover:border-[#818CF8]"}`
                            : "bg-slate-50 border-2 border-slate-300";

                    const limitPillClass =
                      plan.code === "trial"
                        ? "bg-white text-[#D97706] shadow-xs border border-[#FDE68A]/60"
                        : plan.code === "basic"
                          ? "bg-white text-[#2563EB] shadow-xs border border-[#BFDBFE]/60"
                          : plan.code === "pro"
                            ? `bg-white ${isCurrent ? "text-[#7C3AED]" : "text-[#4F46E5]"} shadow-xs border border-[#DDD6FE]/60`
                            : "bg-white text-slate-700 shadow-xs border border-slate-200";

                    return (
                      <div
                        key={plan.code}
                        className={`group relative rounded-[20px] p-6.5 flex flex-col justify-between h-full hover:-translate-y-2 hover:shadow-[0px_20px_40px_-10px_rgba(15,23,42,0.12)] transition-all duration-300 ease-out cursor-default ${cardStyle}`}
                      >
                        {/* Current Plan Badge - Visible by default (not on hover) */}
                        {isCurrent ? (
                          <div
                            style={{
                              background:
                                plan.code === "trial"
                                  ? "linear-gradient(90deg, #F59E0B 0%, #D97706 100%)"
                                  : plan.code === "basic"
                                    ? "linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)"
                                    : "linear-gradient(90deg, #7C3AED 0%, #4F46E5 100%)",
                            }}
                            className="pointer-events-none absolute -top-3 right-6 px-3.5 py-1 rounded-full text-white text-[10.5px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5 z-10"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                            {isExhausted ? "CURRENT / EXHAUSTED" : "CURRENT PLAN"}
                          </div>
                        ) : isPro ? (
                          <div
                            style={{ background: "linear-gradient(90deg, #4F46E5 0%, #2563EB 100%)" }}
                            className="opacity-0 -translate-y-1.5 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out pointer-events-none absolute -top-3 right-6 px-3.5 py-1 rounded-full text-white text-[10.5px] font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(79,70,229,0.4)] z-10"
                          >
                            MOST POPULAR
                          </div>
                        ) : null}

                        <div>
                          {/* Title & Subtitle */}
                          <h3 className="text-[19px] font-bold text-[#0F172A]">
                            {plan.name}
                          </h3>
                          <p className="text-[12.5px] text-[#64748B] mt-0.5">
                            {isCurrent
                              ? isExhausted
                                ? "Your current tier (credits exhausted)"
                                : "Your current active tier"
                              : plan.subtitle}
                          </p>

                          {/* Price */}
                          <div className="flex items-baseline gap-1 mt-4">
                            <span className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">
                              {priceText}
                            </span>
                            {periodText && (
                              <span className="text-[13px] text-[#64748B]">
                                {periodText}
                              </span>
                            )}
                          </div>

                          {/* Limit Badge */}
                          <div className={`my-4 py-2 px-3 rounded-[8px] text-[12.5px] font-semibold text-center transition-colors ${limitPillClass}`}>
                            {limitText}
                          </div>

                          {/* Feature Checklist */}
                          <div className="flex flex-col gap-3 mt-5">
                            {plan.features.map((feature) => (
                              <div
                                key={feature}
                                className="flex items-center gap-2.5 text-[13px] text-[#334155]"
                              >
                                <CheckIcon />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-8">
                          {isCurrent && !isExhausted ? (
                            <button
                              type="button"
                              disabled
                              className="h-[44px] w-full rounded-[12px] font-semibold text-[13px] bg-white text-slate-700 border border-slate-200 shadow-2xs cursor-default flex items-center justify-center"
                            >
                              Current Plan
                            </button>
                          ) : isCurrent && isExhausted && isFree ? (
                            <button
                              type="button"
                              disabled
                              className="h-[44px] w-full rounded-[12px] font-semibold text-[13px] bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            >
                              Trial Exhausted
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectPaidPlan(plan)}
                              className={`h-[44px] w-full rounded-[12px] font-semibold text-[13px] transition-all cursor-pointer ${isPro
                                  ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-xs"
                                  : "border border-[#BFDBFE] text-[#2563EB] bg-white hover:bg-blue-50/50"
                                }`}
                            >
                              {isCurrent && isExhausted
                                ? `Renew ${plan.name}`
                                : plan.code === "pro"
                                  ? isBasicActive && !isExhausted
                                    ? "Upgrade to Pro"
                                    : "Choose Pro"
                                  : "Choose Basic"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Show All / Show Less button shown below Pro Plan card */}
                {isProActive && (
                  <div className="flex items-center justify-center sm:justify-start pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAllPlans((prev) => !prev)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] border border-[#DDD6FE] bg-white hover:bg-[#F5F3FF] text-[#4F46E5] text-[13px] font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <span>{showAllPlans ? "Show Less" : "See All Plans"}</span>
                      {showAllPlans ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Payment Method, Auto-Pay & Billing History Stack */}
              <div
                className={`flex flex-col gap-5 w-full ${visiblePlans.length === 3
                    ? "xl:col-span-4"
                    : visiblePlans.length === 2
                      ? "xl:col-span-4"
                      : "xl:col-span-6"
                  }`}
              >
                {/* 2. Auto-pay Card */}
                <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-[#0F172A]">
                      <svg
                        className="w-4 h-4 text-[#2563EB]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <span>Auto-pay</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleAutoPay}
                      disabled={isTogglingAutoPay}
                      aria-label={`Toggle Auto-pay ${autoPay ? "Off" : "On"}`}
                      className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer disabled:opacity-60 ${
                        autoPay ? "bg-[#4F46E5]" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`block w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${
                          autoPay ? "translate-x-5" : "translate-x-0.5"
                        } top-0.5 absolute`}
                      />
                    </button>
                  </div>

                  <p className="text-[12px] text-[#64748B] leading-snug">
                    Automatically renew monthly via saved card. You'll never run
                    out of credits.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const targetPlan = isProActive
                        ? mergedPlans.find((p) => p.code === "pro")
                        : mergedPlans.find((p) => p.code === "basic");
                      if (targetPlan) handleSelectPaidPlan(targetPlan);
                    }}
                    className="mt-1 h-[36px] w-full rounded-[10px] border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[12.5px] font-medium text-[#334155] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-3.5 h-3.5 text-slate-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Renew Now Manually</span>
                  </button>
                </div>

                {/* 3. Billing History Card */}
                <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14.5px] font-bold text-[#0F172A]">
                      Billing History
                    </h3>
                    {historyError && (
                      <button
                        type="button"
                        onClick={fetchBillingHistory}
                        className="text-[11.5px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                      >
                        Retry
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto w-full">
                    {isHistoryLoading ? (
                      /* Loading Skeleton */
                      <div className="space-y-2 py-2 animate-pulse">
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="h-7 bg-slate-100 rounded-lg w-full"
                          />
                        ))}
                      </div>
                    ) : historyError ? (
                      /* Error State */
                      <div className="py-5 text-center flex flex-col items-center justify-center gap-1.5">
                        <p className="text-[12px] text-red-500 font-medium">
                          Unable to load billing history.
                        </p>
                        <button
                          type="button"
                          onClick={fetchBillingHistory}
                          className="px-3 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    ) : history.length === 0 ? (
                      /* Empty State */
                      <div className="py-6 text-center">
                        <p className="text-[12.5px] text-[#64748B]">
                          No billing history yet.
                        </p>
                      </div>
                    ) : (
                      /* Dynamic History Table */
                      <table className="w-full text-left text-[12.5px]">
                        <thead>
                          <tr className="text-[11px] font-semibold text-[#94A3B8] border-b border-slate-100">
                            <th className="pb-2">Date</th>
                            <th className="pb-2">Plan</th>
                            <th className="pb-2">Amount</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2 text-right">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {history.map((item, idx) => {
                            const badge = formatStatusBadge(item.status);
                            const rowKey =
                              item.id || item.paymentIntentId || item.invoiceNumber || idx;

                            return (
                              <tr
                                key={rowKey}
                                className="hover:bg-slate-50/60 transition-colors"
                              >
                                <td className="py-2.5 font-medium text-slate-700 whitespace-nowrap">
                                  {formatBillingDate(item.createdAt)}
                                </td>
                                <td className="py-2.5 font-bold text-[#0F172A]">
                                  {formatPlanName(item.planCode)}
                                </td>
                                <td className="py-2.5 text-slate-700">
                                  {formatAmount(item.amountCents, item.currency)}
                                </td>
                                <td className="py-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.className}`}
                                  >
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="py-2.5 text-right font-mono text-[11.5px] text-slate-600">
                                  {item.invoiceNumber || "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-6 md:right-8 z-50 animate-in fade-in slide-in-from-top-3 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-[0_4px_20px_-2px_rgba(79,70,229,0.12)] ${
              toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-[#EEF2FF] border border-[#C7D2FE] text-[#4338CA]"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === "error" ? "bg-red-100 text-red-600" : "bg-[#E0E7FF] text-[#4F46E5]"
              }`}
            >
              {toast.type === "error" ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <p className="text-[13px] font-semibold text-[#4338CA] tracking-wide">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className={`ml-2 cursor-pointer transition-colors ${
                toast.type === "error" ? "text-slate-400 hover:text-slate-600" : "text-[#6366F1] hover:text-[#4338CA]"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpgradePlan;
