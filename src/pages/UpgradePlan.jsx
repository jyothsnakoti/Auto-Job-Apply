import React, { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  toggleAutopay,
  getBillingStatus,
  getStripePublishableKey,
  createCardUpdateIntent,
  confirmCardUpdate,
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

const billingData = [
  {
    id: 1,
    date: "Oct 25, 2026",
    plan: "Pro",
    amount: "$12.99",
    status: "Paid",
  },
  {
    id: 2,
    date: "Sep 25, 2026",
    plan: "Basic",
    amount: "$4.99",
    status: "Paid",
  },
  {
    id: 3,
    date: "Aug 25, 2026",
    plan: "Basic",
    amount: "$4.99",
    status: "Paid",
  },
];

/**
 * Inner Stripe Card Update Form component rendered within Elements context
 */
const CardUpdateModalForm = ({ clientSecret, onSuccess, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [nameOnCard, setNameOnCard] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!stripe || !elements || !clientSecret) {
      setErrorMessage("Payment system is still initializing. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 1. Submit Elements
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || "Please check your card details.");
        setIsSubmitting(false);
        return;
      }

      // 2. Confirm SetupIntent with Stripe directly
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/upgrade-plan`,
          payment_method_data: nameOnCard.trim()
            ? {
              billing_details: {
                name: nameOnCard.trim(),
              },
            }
            : undefined,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setErrorMessage(confirmError.message || "Failed to confirm card with Stripe.");
        setIsSubmitting(false);
        return;
      }

      // 3. Get the actual Stripe SetupIntent ID
      const intentId = setupIntent?.id;

      console.log("========== STRIPE SETUP RESULT ==========");
      console.log("SetupIntent:", setupIntent);
      console.log("SetupIntent ID:", intentId);
      console.log("SetupIntent Status:", setupIntent?.status);
      console.log("==========================================");

      // SetupIntent ID is required
      if (!intentId) {
        setErrorMessage(
          "Stripe did not return a SetupIntent ID."
        );
        return;
      }

      // IMPORTANT:
      // Backend requires the SetupIntent to be succeeded
      // before /confirm-card-update can be called.
      if (setupIntent?.status !== "succeeded") {
        console.error(
          "❌ SetupIntent is not succeeded:",
          setupIntent?.status
        );

        setErrorMessage(
          `Card setup was not completed. Stripe status: ${setupIntent?.status || "unknown"
          }.`
        );

        return;
      }

      // 4. SetupIntent succeeded — now register the card
      // with the backend.
      console.log(
        "✅ SetupIntent succeeded. Calling confirm-card-update:",
        intentId
      );

      const confirmRes = await confirmCardUpdate(intentId);

      const msg =
        typeof confirmRes === "string"
          ? confirmRes
          : confirmRes?.message ||
          "Card updated successfully.";

      console.log(
        "✅ Backend confirmed card update:",
        msg
      );

      setSuccessMessage(msg);

      if (onSuccess) {
        await onSuccess(setupIntent);
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Card update error:", err);
      setErrorMessage(err?.message || "Failed to update card details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[12px] text-red-600 text-[12px] font-medium leading-tight flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="text-red-500 hover:text-red-700 ml-2 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[12px] text-emerald-700 text-[12px] font-medium leading-tight flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="text-emerald-500 hover:text-emerald-700 ml-2 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Name on Card */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-slate-800">
          Name on Card
        </label>
        <div className="flex items-center gap-2.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 focus-within:border-[#4F46E5] focus-within:bg-white focus-within:ring-1 focus-within:ring-[#4F46E5] transition-all">
          <svg className="w-4 h-4 text-[#64748B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <input
            type="text"
            disabled={isSubmitting}
            placeholder="Full Name"
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.target.value)}
            className="w-full bg-transparent text-[13px] text-slate-800 placeholder:text-[#94A3B8] outline-none disabled:opacity-60"
          />
        </div>
      </div>

      {/* Stripe PaymentElement */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-medium text-slate-800">
          Card Details <span className="text-red-500">*</span>
        </label>
        <div className="p-3.5 rounded-[12px] bg-[#F8FAFC] border border-[#E2E8F0]">
          <PaymentElement />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 mt-2">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="px-4 py-2.5 rounded-[10px] border border-[#E2E8F0] hover:bg-slate-50 text-slate-600 font-medium text-[13px] transition-all cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !stripe || !elements}
          className="px-6 py-2.5 rounded-[10px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-medium text-[13.5px] shadow-sm transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Updating Card...</span>
            </>
          ) : (
            <span>Update Card</span>
          )}
        </button>
      </div>
    </form>
  );
};

const UpgradePlan = () => {
  const [selectedPlan, setSelectedPlan] = useState("Pro");
  const [autoPay, setAutoPay] = useState(false);
  const [isTogglingAutoPay, setIsTogglingAutoPay] = useState(false);
  const [autoPayError, setAutoPayError] = useState("");
  const [autoPayMessage, setAutoPayMessage] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [isLoadingSetup, setIsLoadingSetup] = useState(false);
  const [setupInitError, setSetupInitError] = useState("");

  // Saved Card Details State
  const [savedCard, setSavedCard] = useState({
    brand: "VISA",
    last4: "4242",
    exp: "04/29",
  });

  // Billing status state
  const [billing, setBilling] = useState(() => {
    try {
      const raw = localStorage.getItem("billingStatus") || sessionStorage.getItem("billingStatus");
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getBillingStatus();
        if (data) {
          setBilling(data);
          if (data.autoPay !== undefined) {
            setAutoPay(Boolean(data.autoPay));
          }
          if (data.cardLast4 || data.cardLastFour) {
            setSavedCard((prev) => ({
              ...prev,
              last4: data.cardLast4 || data.cardLastFour || prev.last4,
              brand: (data.cardBrand || prev.brand).toUpperCase(),
              exp: data.cardExp || data.cardExpiry || prev.exp,
            }));
          }
        }
      } catch (err) {
        console.warn("[UpgradePlan] Failed to fetch billing status:", err);
      }
    };
    fetchStatus();

    const handleBillingUpdate = (e) => {
      if (e?.detail) {
        setBilling(e.detail);
        if (e.detail.autoPay !== undefined) setAutoPay(Boolean(e.detail.autoPay));
        if (e.detail.cardLast4 || e.detail.cardLastFour) {
          setSavedCard((prev) => ({
            ...prev,
            last4: e.detail.cardLast4 || e.detail.cardLastFour || prev.last4,
            brand: (e.detail.cardBrand || prev.brand).toUpperCase(),
            exp: e.detail.cardExp || e.detail.cardExpiry || prev.exp,
          }));
        }
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

  const hasPlan = Boolean(billing?.hasPlan);
  const planTitle = hasPlan ? (billing?.planName || "Active Plan") : "No active plan";
  const applicationAllowance = typeof billing?.applicationAllowance === "number" ? billing.applicationAllowance : 0;
  const usedApplications = typeof billing?.usedApplications === "number" ? billing.usedApplications : 0;
  const remainingApplications = typeof billing?.remainingApplications === "number" ? billing.remainingApplications : 0;
  const rawInterval = (billing?.billingInterval || "month").toLowerCase().trim();
  const intervalDisplay = rawInterval ? `applications / ${rawInterval}` : "applications";

  const progress =
    applicationAllowance > 0
      ? (usedApplications / applicationAllowance) * 100
      : 0;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const handleToggleAutoPay = async () => {
    if (isTogglingAutoPay) return;
    const nextState = !autoPay;
    try {
      setIsTogglingAutoPay(true);
      setAutoPayError("");
      setAutoPayMessage("");
      const result = await toggleAutopay(nextState);
      setAutoPay(nextState);
      setAutoPayMessage(result?.message || "Auto-pay updated.");
    } catch (err) {
      console.error("Failed to toggle auto-pay:", err);
      setAutoPayError(err.message || "Failed to update auto-pay.");
    } finally {
      setIsTogglingAutoPay(false);
    }
  };

  const handleOpenPaymentModal = async () => {
    setIsPaymentModalOpen(true);
    setIsLoadingSetup(true);
    setSetupInitError("");
    setSetupClientSecret(null);

    try {
      // 1. Fetch Stripe Publishable Key
      const publishableKey = await getStripePublishableKey();
      if (!publishableKey) {
        throw new Error(
          "Stripe publishable key is not available. Please verify server configuration."
        );
      }
      const stripeObj = await loadStripe(publishableKey);
      setStripePromise(stripeObj);

      // 2. Create SetupIntent on backend
      const intentRes = await createCardUpdateIntent();
      const secret =
        intentRes?.clientSecret ||
        (typeof intentRes === "string" ? intentRes : null);

      if (!secret) {
        throw new Error(
          "Failed to initialize card setup session with backend."
        );
      }
      setSetupClientSecret(secret);
    } catch (err) {
      console.error("Failed to initialize card update modal:", err);
      setSetupInitError(
        err.message || "Failed to initialize secure card update."
      );
    } finally {
      setIsLoadingSetup(false);
    }
  };

  const handleCardUpdateSuccess = async () => {
    try {
      const data = await getBillingStatus();
      if (data) {
        setBilling(data);
        if (data.cardLast4 || data.cardLastFour) {
          setSavedCard((prev) => ({
            ...prev,
            last4: data.cardLast4 || data.cardLastFour || prev.last4,
            brand: (data.cardBrand || prev.brand).toUpperCase(),
            exp: data.cardExp || data.cardExpiry || prev.exp,
          }));
        }
      }
    } catch (err) {
      console.warn("Could not reload billing status after card update:", err);
    }
  };

  const elementsOptions = useMemo(() => {
    if (!setupClientSecret) return null;
    return {
      clientSecret: setupClientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "#4F46E5",
          colorBackground: "#FFFFFF",
          colorText: "#0F172A",
          colorDanger: "#EF4444",
          fontFamily:
            '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
          borderRadius: "12px",
          fontSizeBase: "14px",
          spacingUnit: "4px",
          spacingGridRow: "12px",
        },
        rules: {
          ".Input": {
            border: "1px solid #E2E8F0",
            boxShadow: "none",
            padding: "10px 12px",
            borderRadius: "12px",
          },
          ".Input:focus": {
            border: "1px solid #4F46E5",
            boxShadow: "0 0 0 2px rgba(79, 70, 229, 0.15)",
          },
        },
      },
    };
  }, [setupClientSecret]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (Scrollable) */}
      <div className="flex min-w-0 flex-1 flex-col h-screen overflow-y-auto bg-[#F8FAFC]">
        {/* Top Header */}
        <Header />

        {/* Upgrade Plan Main Content */}
        <main className="flex-1 px-8 py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
          {/* Page Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-[20px] md:text-[22px] font-bold text-black tracking-tight">
              Upgrade Plan
            </h1>
            <p className="text-[13px] text-[#64748B]">
              Choose a plan that fits your job search needs. Get higher application limits and unlock advanced features.
            </p>
          </div>

          {/* Top Row: Current Plan Status & Need More Apps Alert */}
          <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex items-center justify-between gap-6 flex-wrap">
            {/* Left: Plan Info + Progress Bar */}
            <div className="flex items-center gap-6 flex-wrap flex-1 min-w-[300px]">
              {/* Crown Icon Box + Info */}
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] rounded-[12px] bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                  </svg>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10.5px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    CURRENT PLAN
                  </span>
                  <span className="text-[16.5px] font-bold text-[#0F172A] leading-tight">
                    {planTitle}
                  </span>
                  <span className="text-[12px] text-[#64748B] mt-0.5">
                    {hasPlan ? `${applicationAllowance} ${intervalDisplay}` : "0 applications remaining"}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-[320px]">
                <div className="w-full h-[7px] bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-[#4F46E5] h-full rounded-full transition-all duration-300" style={{ width: `${clampedProgress}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11.5px] text-[#64748B]">
                  <span>{usedApplications} used</span>
                  <span>{remainingApplications} remaining</span>
                </div>
              </div>
            </div>

            {/* Right: Need more applications Alert Box */}
            <div className="bg-[#FEFCE8] border border-[#FEF08A] rounded-[16px] p-4 flex items-start gap-3 max-w-[440px]">
              <div className="w-6 h-6 rounded-[8px] bg-[#FEF08A] text-[#854D0E] flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-[#854D0E]">
                  Need more applications?
                </span>
                <p className="text-[12px] text-[#A16207] mt-0.5 leading-snug">
                  Upgrade to increase your monthly application quota and keep your job search momentum going.
                </p>
              </div>
            </div>
          </div>

          {/* Main Section: Select a Plan */}
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-[16px] font-bold text-[#0F172A]">
              Select a Plan
            </h2>

            {/* 3 Columns Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">

              {/* Col 1: Basic Plan Card */}
              <div
                onClick={() => setSelectedPlan("Basic")}
                className={`bg-white rounded-[20px] p-6.5 flex flex-col justify-between shadow-[0_1px_3px_rgba(15,23,42,0.02)] transition-all cursor-pointer ${selectedPlan === "Basic"
                  ? "border-2 border-[#4F46E5] shadow-md"
                  : "border border-[#E2E8F0] hover:border-slate-300"
                  }`}
              >
                <div>
                  {/* Plan Title & Subtitle */}
                  <h3 className="text-[19px] font-bold text-[#0F172A]">Basic</h3>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5">
                    Great for getting started
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">
                      $4.99
                    </span>
                    <span className="text-[13px] text-[#64748B]">/ month</span>
                  </div>

                  {/* Limit Badge */}
                  <div className="my-4 py-2 px-3 rounded-[8px] bg-[#EEF2FF] text-[#4F46E5] text-[12.5px] font-semibold text-center">
                    250 applications / month
                  </div>

                  {/* Feature Checklist */}
                  <div className="flex flex-col gap-3 mt-5">
                    {[
                      "Job discovery & matching",
                      "ATS matching",
                      "Job-specific resume generation",
                      "Automated applications",
                      "Application tracking",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5 text-[13px] text-[#334155]">
                        <CheckIcon />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Choose Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan("Basic");
                  }}
                  className={`mt-8 h-[44px] w-full rounded-[12px] font-semibold text-[13px] transition-all cursor-pointer ${selectedPlan === "Basic"
                    ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-xs"
                    : "border border-[#BFDBFE] text-[#2563EB] bg-white hover:bg-blue-50/50"
                    }`}
                >
                  Choose Basic
                </button>
              </div>

              {/* Col 2: Pro Plan Card (MOST POPULAR) */}
              <div
                onClick={() => setSelectedPlan("Pro")}
                className={`relative bg-white rounded-[20px] p-6.5 flex flex-col justify-between shadow-md transition-all cursor-pointer ${selectedPlan === "Pro"
                  ? "border-2 border-[#4F46E5]"
                  : "border border-[#E2E8F0] hover:border-slate-300"
                  }`}
              >
                {/* Most Popular Badge */}
                <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[#4F46E5] text-white text-[10.5px] font-bold uppercase tracking-wider shadow-sm">
                  MOST POPULAR
                </div>

                <div>
                  {/* Plan Title & Subtitle */}
                  <h3 className="text-[19px] font-bold text-[#0F172A]">Pro</h3>
                  <p className="text-[12.5px] text-[#64748B] mt-0.5">
                    Best for active job seekers
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-[32px] font-extrabold text-[#0F172A] tracking-tight">
                      $12.99
                    </span>
                    <span className="text-[13px] text-[#64748B]">/ quarter</span>
                  </div>

                  {/* Limit Badge */}
                  <div className="my-4 py-2 px-3 rounded-[8px] bg-[#EEF2FF] text-[#4F46E5] text-[12.5px] font-semibold text-center">
                    1000 applications / quarter
                  </div>

                  {/* Feature Checklist */}
                  <div className="flex flex-col gap-3 mt-5">
                    {[
                      "Job discovery & matching",
                      "ATS matching",
                      "Job-specific resume generation",
                      "Automated applications",
                      "Application tracking",
                      "Priority job matching",
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-2.5 text-[13px] text-[#334155]">
                        <CheckIcon />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Choose Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan("Pro");
                  }}
                  className={`mt-8 h-[44px] w-full rounded-[12px] font-semibold text-[13px] transition-all cursor-pointer ${selectedPlan === "Pro"
                    ? "bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-xs"
                    : "border border-[#BFDBFE] text-[#2563EB] bg-white hover:bg-blue-50/50"
                    }`}
                >
                  Choose Pro
                </button>
              </div>

              {/* Col 3: Payment Method, Auto-Pay & Billing History Stack */}
              <div className="flex flex-col gap-5 w-full">

                {/* 1. Payment Method Card */}
                <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-[#0F172A]">
                      <svg className="w-4 h-4 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      <span>Payment Method</span>
                    </div>

                    <button
                      type="button"
                      onClick={handleOpenPaymentModal}
                      className="text-[12.5px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors cursor-pointer"
                    >
                      Update payment details
                    </button>
                  </div>

                  {/* Card Display Box */}
                  <div className="p-3 rounded-[12px] border border-slate-100 bg-[#F8FAFC] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 rounded-[6px] bg-[#1E293B] text-white text-[11px] font-bold tracking-wider uppercase">
                        {savedCard.brand}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-[#0F172A]">
                          •••• •••• •••• {savedCard.last4}
                        </span>
                        <span className="text-[11px] text-[#94A3B8]">
                          Exp {savedCard.exp}
                        </span>
                      </div>
                    </div>

                    <button type="button" className="text-slate-400 hover:text-slate-600 p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 2. Auto-pay Card */}
                <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-[#0F172A]">
                      <svg className="w-4 h-4 text-[#2563EB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                      <span>Auto-pay</span>
                    </div>

                    <button
                      type="button"
                      disabled={isTogglingAutoPay}
                      onClick={handleToggleAutoPay}
                      className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${autoPay ? "bg-[#4F46E5]" : "bg-slate-300"
                        }`}
                      aria-label="Toggle Auto-pay"
                    >
                      <span
                        className={`block w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform ${autoPay ? "translate-x-5" : "translate-x-0.5"
                          } top-0.5 absolute flex items-center justify-center`}
                      >
                        {isTogglingAutoPay && (
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                        )}
                      </span>
                    </button>
                  </div>

                  <p className="text-[12px] text-[#64748B] leading-snug">
                    Automatically renew monthly via saved card. You'll never run out of credits.
                  </p>

                  {autoPayError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 text-[11.5px] font-medium leading-tight flex items-center justify-between">
                      <span>{autoPayError}</span>
                      <button
                        type="button"
                        onClick={() => setAutoPayError("")}
                        className="text-red-500 hover:text-red-700 ml-2 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {autoPayMessage && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[11.5px] font-medium leading-tight flex items-center justify-between">
                      <span>{autoPayMessage}</span>
                      <button
                        type="button"
                        onClick={() => setAutoPayMessage("")}
                        className="text-emerald-500 hover:text-emerald-700 ml-2 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="mt-1 h-[36px] w-full rounded-[10px] border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[12.5px] font-medium text-[#334155] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Renew Now Manually</span>
                  </button>
                </div>

                {/* 3. Billing History Card */}
                <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3">
                  <h3 className="text-[14.5px] font-bold text-[#0F172A]">
                    Billing History
                  </h3>

                  <div className="overflow-x-auto w-full">
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
                        {billingData.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 font-medium text-slate-700">{item.date}</td>
                            <td className="py-2.5 font-bold text-[#0F172A]">{item.plan}</td>
                            <td className="py-2.5 text-slate-700">{item.amount}</td>
                            <td className="py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF5] text-[#059669]">
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                className="text-[#4F46E5] hover:text-[#4338CA] p-1 transition-colors cursor-pointer inline-flex items-center justify-center"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add A New Card / Update Payment Details Modal Popup */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[460px] rounded-[20px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-[17px] font-bold text-[#0F172A]">
                  Update Payment Details
                </h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  Enter your replacement card to update your payment method.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              >
                <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Loading Setup Session */}
            {isLoadingSetup && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <span className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
                <p className="text-[13px] font-medium text-slate-600">
                  Initializing secure card form...
                </p>
              </div>
            )}

            {/* Error Initializing Setup */}
            {!isLoadingSetup && setupInitError && (
              <div className="py-6 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <svg className="w-5 h-5 stroke-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="text-[13px] text-red-600 font-medium max-w-sm">
                  {setupInitError}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[12.5px] font-medium hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenPaymentModal}
                    className="px-4 py-2 rounded-lg bg-[#4F46E5] text-white text-[12.5px] font-medium hover:bg-indigo-700 cursor-pointer"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {/* Active Stripe Elements Form */}
            {!isLoadingSetup && !setupInitError && stripePromise && elementsOptions && (
              <Elements
                stripe={stripePromise}
                options={elementsOptions}
                key={setupClientSecret}
              >
                <CardUpdateModalForm
                  clientSecret={setupClientSecret}
                  onSuccess={handleCardUpdateSuccess}
                  onClose={() => setIsPaymentModalOpen(false)}
                />
              </Elements>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpgradePlan;
