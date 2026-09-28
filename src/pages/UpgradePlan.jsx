import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import {
  getBillingStatus,
  getBillingPlans,
  getBillingHistory,
  getStripePublishableKey,
  createCardUpdateIntent,
  confirmCardUpdate,
  getPaymentMethod,
} from "../services/billingService";
import { getStoredUser } from "../services/authService";

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

/**
 * Inner Card Update Form within Stripe Elements context
 */
const CardUpdateForm = ({ clientSecret, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!stripe || !elements || !clientSecret) {
      setErrorMessage("Payment gateway is initializing. Please wait a moment.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Step 1: Client-side validation via Elements
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || "Please check your card details.");
        setIsSubmitting(false);
        return;
      }

      // Retrieve authenticated user's details for required billing name and email
      const user = getStoredUser();
      const billingName =
        user?.fullName ||
        user?.name ||
        (user?.email ? user.email.split("@")[0] : "") ||
        "Cardholder";
      const billingEmail = user?.email || "";

      // Step 2: Confirm SetupIntent with Stripe
      const { error: setupError, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: billingName,
              email: billingEmail,
            },
          },
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (setupError) {
        setErrorMessage(setupError.message || "Card setup failed with Stripe.");
        setIsSubmitting(false);
        return;
      }

      if (!setupIntent || setupIntent.status !== "succeeded") {
        setIsSubmitting(false);
        if (setupIntent?.status === "requires_action") {
          setErrorMessage("Additional card verification is required. Please follow any on-screen prompts or try another card.");
          return;
        }
        if (setupIntent?.status === "requires_payment_method") {
          setErrorMessage("The payment method was not accepted. Please check the card details and try again.");
          return;
        }
        setErrorMessage(`Card setup incomplete (Status: ${setupIntent?.status || "unknown"}). Please try again.`);
        return;
      }

      // Step 3: Confirm card update with backend
      try {
        await confirmCardUpdate(setupIntent.id);
      } catch (backendErr) {
        console.error("Backend confirm-card-update failed:", backendErr);
        setErrorMessage("Unable to update payment method. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Step 4: Successful update!
      onSuccess();
    } catch (err) {
      console.error("Card update execution error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred while updating card details.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMessage && (
        <div className="p-3 rounded-[10px] bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[12.5px] font-medium flex items-start gap-2">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="flex-1 leading-snug">{errorMessage}</span>
        </div>
      )}

      <div className="rounded-[12px] border border-slate-200 bg-white p-3.5">
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: ["card"],
            wallets: {
              applePay: "never",
              googlePay: "never",
            },
            fields: {
              billingDetails: {
                name: "never",
                email: "never",
              },
            },
            terms: {
              card: "never",
            },
          }}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-[10px] border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-[13px] transition-colors cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-[10px] bg-[#004B97] hover:bg-[#003B77] text-white font-medium text-[13.5px] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Saving card...</span>
            </>
          ) : (
            <span>Save Payment Method</span>
          )}
        </button>
      </div>
    </form>
  );
};

const UpgradePlan = () => {
  const navigate = useNavigate();
  const [autoPay, setAutoPay] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [backendPlans, setBackendPlans] = useState([]);

  // Saved Payment Method state
  const [savedPaymentMethod, setSavedPaymentMethod] = useState(null);
  const [isPaymentMethodLoading, setIsPaymentMethodLoading] = useState(true);

  // SetupIntent state for card update modal
  const [setupClientSecret, setSetupClientSecret] = useState(null);
  const [setupStripePromise, setSetupStripePromise] = useState(null);
  const [isInitializingSetup, setIsInitializingSetup] = useState(false);
  const [setupInitError, setSetupInitError] = useState("");

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

  // Fetch current payment method
  const fetchPaymentMethod = async () => {
    try {
      setIsPaymentMethodLoading(true);
      const data = await getPaymentMethod();
      if (data) {
        setSavedPaymentMethod(data);
      } else {
        setSavedPaymentMethod(null);
      }
    } catch (err) {
      console.warn("[UpgradePlan] Failed to fetch payment method:", err);
      setSavedPaymentMethod(null);
    } finally {
      setIsPaymentMethodLoading(false);
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
    fetchPaymentMethod();

    const handleBillingUpdate = (e) => {
      if (e?.detail) setBilling(e.detail);
      else fetchStatusAndPlans();
      fetchBillingHistory();
      fetchPaymentMethod();
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

  // Filter visible plans strictly based on current billing status & remaining applications:
  // EXHAUSTED CREDITS OVERRIDE:
  // If remainingApplications === 0 -> ALWAYS show ALL AVAILABLE PLANS [ Trial Pack, Basic Plan, Pro Plan ]
  // CASE 1: Trial Pack active AND remainingApplications > 0 -> [ Trial Pack, Basic Plan, Pro Plan ]
  // CASE 2: Basic Plan active AND remainingApplications > 0 -> [ Basic Plan, Pro Plan ]
  // CASE 3: Pro Plan active AND remainingApplications > 0   -> [ Pro Plan ]
  let visiblePlans = [];
  if (isExhausted) {
    visiblePlans = mergedPlans;
  } else if (isProActive) {
    visiblePlans = mergedPlans.filter((p) => p.code === "pro");
  } else if (isBasicActive) {
    visiblePlans = mergedPlans.filter((p) => p.code === "basic" || p.code === "pro");
  } else {
    // Trial Pack or default
    visiblePlans = mergedPlans;
  }

  // Card formatting helpers
  const formatCardBrand = (pm) => {
    if (!pm) return "CARD";
    const brand = pm.brand || pm.card?.brand || pm.cardBrand || pm.type || "CARD";
    return String(brand).toUpperCase();
  };

  const formatCardLast4 = (pm) => {
    if (!pm) return "••••";
    const last4 = pm.last4 || pm.card?.last4 || pm.lastFour || pm.last_4 || "••••";
    return `•••• •••• •••• ${last4}`;
  };

  const formatCardExpiry = (pm) => {
    if (!pm) return "";
    const expMonth = pm.expMonth || pm.card?.expMonth || pm.exp_month || pm.card?.exp_month || pm.expiryMonth;
    const expYear = pm.expYear || pm.card?.expYear || pm.exp_year || pm.card?.exp_year || pm.expiryYear;
    if (expMonth && expYear) {
      const monthStr = String(expMonth).padStart(2, "0");
      const yearStr = String(expYear).slice(-2);
      return `Exp ${monthStr}/${yearStr}`;
    }
    if (pm.expiry) return `Exp ${pm.expiry}`;
    return "";
  };

  // Open Stripe card update flow
  const handleOpenPaymentModal = async () => {
    setIsPaymentModalOpen(true);
    setSetupInitError("");
    setSetupClientSecret(null);
    setIsInitializingSetup(true);

    try {
      // 1. Fetch publishable key
      const publishableKey = await getStripePublishableKey();
      if (!publishableKey) {
        throw new Error("Stripe publishable key is not available.");
      }

      // 2. Load Stripe.js instance
      const stripeObj = await loadStripe(publishableKey);
      setSetupStripePromise(stripeObj);

      // 3. Create fresh Card Update SetupIntent
      const secret = await createCardUpdateIntent();
      if (!secret) {
        throw new Error("Unable to prepare payment method update.");
      }

      setSetupClientSecret(secret);
    } catch (err) {
      console.error("[UpgradePlan] SetupIntent initialization failed:", err);
      setSetupInitError(err?.message || "Unable to prepare payment method update.");
    } finally {
      setIsInitializingSetup(false);
    }
  };

  const handlePaymentUpdateSuccess = async () => {
    setIsPaymentModalOpen(false);
    setSetupClientSecret(null);
    try {
      await fetchPaymentMethod();
    } catch (err) {
      console.warn("[UpgradePlan] Error refreshing payment method:", err);
    }
  };

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
        <main className="flex-1 px-8 py-7 flex flex-col gap-6 w-full bg-[#F8FAFC]">
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
                  className={`w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0 ${
                    isProActive
                      ? "bg-[#EEF2FF] text-[#4F46E5]"
                      : isBasicActive
                      ? "bg-[#ECFDF5] text-[#059669]"
                      : "bg-[#FEF3C7] text-[#D97706]"
                  }`}
                >
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
                    {`${applicationAllowance} ${intervalDisplay}`}
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-[320px]">
                <div className="w-full h-[7px] bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExhausted
                        ? "bg-[#EF4444]"
                        : isProActive
                        ? "bg-[#4F46E5]"
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
              className={`rounded-[16px] p-4 flex items-start gap-3 max-w-[440px] border ${
                isExhausted
                  ? "bg-[#FEF2F2] border-[#FECACA]"
                  : isProActive
                  ? "bg-[#F0FDF4] border-[#BBF7D0]"
                  : "bg-[#FEFCE8] border-[#FEF08A]"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 ${
                  isExhausted
                    ? "bg-[#FEE2E2] text-[#DC2626]"
                    : isProActive
                    ? "bg-[#DCFCE7] text-[#15803D]"
                    : "bg-[#FEF08A] text-[#854D0E]"
                }`}
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-[13px] font-bold ${
                    isExhausted
                      ? "text-[#DC2626]"
                      : isProActive
                      ? "text-[#15803D]"
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
                  className={`text-[12px] mt-0.5 leading-snug ${
                    isExhausted
                      ? "text-[#991B1B]"
                      : isProActive
                      ? "text-[#166534]"
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
              {isExhausted
                ? "Available Plans"
                : isProActive
                ? "Active Plan"
                : isBasicActive
                ? "Available Plans"
                : "Select a Plan"}
            </h2>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
              {/* Left Column(s): Filtered Plan Cards */}
              <div
                className={`grid gap-6 items-start ${
                  visiblePlans.length === 3
                    ? "xl:col-span-8 grid-cols-1 md:grid-cols-3"
                    : visiblePlans.length === 2
                    ? "xl:col-span-8 grid-cols-1 sm:grid-cols-2"
                    : "xl:col-span-6 grid-cols-1 max-w-[480px]"
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

                  return (
                    <div
                      key={plan.code}
                      className={`relative bg-white rounded-[20px] p-6.5 flex flex-col justify-between shadow-[0_1px_3px_rgba(15,23,42,0.02)] transition-all ${
                        isCurrent
                          ? isExhausted
                            ? "border-2 border-amber-500 bg-amber-50/10"
                            : "border-2 border-[#10B981] bg-slate-50/20"
                          : isPro
                          ? "border-2 border-[#4F46E5] shadow-md"
                          : "border border-[#E2E8F0] hover:border-slate-300"
                      }`}
                    >
                      {/* Current Plan Badge or Most Popular Badge */}
                      {isCurrent ? (
                        <div
                          className={`absolute -top-3 right-6 px-3 py-1 rounded-full text-white text-[10.5px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                            isExhausted ? "bg-[#D97706]" : "bg-[#10B981]"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          {isExhausted ? "CURRENT / EXHAUSTED" : "CURRENT PLAN"}
                        </div>
                      ) : isPro ? (
                        <div className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-[#4F46E5] text-white text-[10.5px] font-bold uppercase tracking-wider shadow-sm">
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
                        <div className="my-4 py-2 px-3 rounded-[8px] bg-[#EEF2FF] text-[#4F46E5] text-[12.5px] font-semibold text-center">
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
                            className="h-[44px] w-full rounded-[12px] font-semibold text-[13px] bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed"
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
                            className={`h-[44px] w-full rounded-[12px] font-semibold text-[13px] transition-all cursor-pointer ${
                              isPro
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

              {/* Right Column: Payment Method, Auto-Pay & Billing History Stack */}
              <div
                className={`flex flex-col gap-5 w-full ${
                  visiblePlans.length === 3
                    ? "xl:col-span-4"
                    : visiblePlans.length === 2
                    ? "xl:col-span-4"
                    : "xl:col-span-6"
                }`}
              >
                {/* 1. Payment Method Card */}
                <div className="bg-white rounded-[20px] border border-[#E2E8F0] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[14px] font-bold text-[#0F172A]">
                      <svg
                        className="w-4 h-4 text-[#059669]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
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
                      {savedPaymentMethod ? "Update payment details" : "Add payment details"}
                    </button>
                  </div>

                  {/* Card Details Box */}
                  {isPaymentMethodLoading ? (
                    <div className="p-3 rounded-[12px] border border-slate-100 bg-[#F8FAFC] flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-6 bg-slate-200 rounded-[6px]" />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="w-28 h-3.5 bg-slate-200 rounded" />
                        <div className="w-16 h-2.5 bg-slate-200 rounded" />
                      </div>
                    </div>
                  ) : savedPaymentMethod ? (
                    <div className="p-3 rounded-[12px] border border-slate-100 bg-[#F8FAFC] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="px-2.5 py-1 rounded-[6px] bg-[#1E293B] text-white text-[11px] font-bold tracking-wider">
                          {formatCardBrand(savedPaymentMethod)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-[#0F172A]">
                            {formatCardLast4(savedPaymentMethod)}
                          </span>
                          {formatCardExpiry(savedPaymentMethod) && (
                            <span className="text-[11px] text-[#94A3B8]">
                              {formatCardExpiry(savedPaymentMethod)}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenPaymentModal}
                        title="Update payment details"
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="5" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="19" r="1.5" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-[12px] border border-dashed border-slate-200 bg-[#F8FAFC] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 text-slate-500 text-[12.5px]">
                        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
                          <line x1="2" y1="10" x2="22" y2="10" strokeWidth="1.5" />
                        </svg>
                        <span>No saved payment method</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenPaymentModal}
                        className="text-[12px] font-semibold text-[#4F46E5] hover:text-[#4338CA] cursor-pointer"
                      >
                        Add Card
                      </button>
                    </div>
                  )}
                </div>

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
                      onClick={() => setAutoPay(!autoPay)}
                      className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
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

      {/* Update Payment Details Stripe Modal Popup */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[480px] rounded-[20px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex flex-col">
                <h3 className="text-[17px] font-bold text-[#0F172A]">
                  Update Payment Details
                </h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  Add or update your payment card securely via Stripe
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  setSetupClientSecret(null);
                }}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              >
                <svg
                  className="w-5 h-5 stroke-[2.5]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="pt-4">
              {isInitializingSetup ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <svg
                    className="animate-spin h-7 w-7 text-[#4F46E5]"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span className="text-[13.5px] font-medium text-slate-700">
                    Updating payment method...
                  </span>
                  <span className="text-[11.5px] text-slate-400">
                    Preparing secure card connection...
                  </span>
                </div>
              ) : setupInitError ? (
                <div className="py-6 flex flex-col items-center gap-4 text-center">
                  <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] font-semibold text-slate-900">
                      Unable to prepare payment method update.
                    </span>
                    <p className="text-[12px] text-slate-500 max-w-[320px]">
                      {setupInitError}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="px-4 py-2 rounded-[10px] border border-slate-200 text-slate-700 text-[13px] font-medium hover:bg-slate-50 cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenPaymentModal}
                      className="px-5 py-2 rounded-[10px] bg-[#004B97] text-white text-[13px] font-medium hover:bg-[#003B77] cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : setupClientSecret && setupStripePromise ? (
                <Elements
                  stripe={setupStripePromise}
                  options={{
                    clientSecret: setupClientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "#004B97",
                        colorBackground: "#FFFFFF",
                        colorText: "#0F172A",
                        colorDanger: "#EF4444",
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                        borderRadius: "12px",
                        fontSizeBase: "14px",
                      },
                    },
                  }}
                >
                  <CardUpdateForm
                    clientSecret={setupClientSecret}
                    onSuccess={handlePaymentUpdateSuccess}
                    onCancel={() => {
                      setIsPaymentModalOpen(false);
                      setSetupClientSecret(null);
                    }}
                  />
                </Elements>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpgradePlan;
