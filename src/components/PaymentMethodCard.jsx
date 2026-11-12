import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  getPaymentCards,
  setDefaultCard,
  deleteSavedCard,
  getStripePublishableKey,
  createCardUpdateIntent,
  confirmCardUpdate,
} from "../services/billingService";
import { getStoredUser } from "../services/authService";

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
      const billingEmail = user?.email ? String(user.email).trim() : "";

      const billingDetails = {
        name: billingName,
      };
      if (billingEmail) {
        billingDetails.email = billingEmail;
      }

      // Step 2: Confirm SetupIntent with Stripe
      const { error: setupError, setupIntent } = await stripe.confirmSetup({
        elements,
        clientSecret,
        confirmParams: {
          payment_method_data: {
            billing_details: billingDetails,
          },
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (setupError) {
        console.error("[Stripe SetupIntent] confirmation failed:", {
          type: setupError.type,
          code: setupError.code,
          decline_code: setupError.decline_code,
          message: setupError.message,
        });
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
        await confirmCardUpdate(setupIntent.id, false);
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
          style={{ background: "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)" }}
          className="px-6 py-2.5 rounded-[10px] text-white font-medium text-[13.5px] shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
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

const PaymentMethodCard = ({ className = "" }) => {
  const [savedPaymentMethod, setSavedPaymentMethod] = useState(null);
  const [savedCards, setSavedCards] = useState([]);
  const [isPaymentMethodLoading, setIsPaymentMethodLoading] = useState(true);
  const [paymentMethodError, setPaymentMethodError] = useState("");
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCardDetailsModalOpen, setIsCardDetailsModalOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");

  // SetupIntent state for card update modal
  const [setupClientSecret, setSetupClientSecret] = useState(null);
  const [setupStripePromise, setSetupStripePromise] = useState(null);
  const [isInitializingSetup, setIsInitializingSetup] = useState(false);
  const [setupInitError, setSetupInitError] = useState("");

  // Helpers
  const formatCardBrand = (pm) => {
    if (!pm) return "Card";
    const rawBrand = pm.brand || pm.card?.brand || pm.cardBrand || pm.type || "";
    if (!rawBrand) return "Card";
    const b = String(rawBrand).trim().toLowerCase();
    if (b === "amex" || b === "american express") return "Amex";
    if (b === "visa") return "Visa";
    if (b === "mastercard") return "Mastercard";
    if (b === "discover") return "Discover";
    if (b === "diners" || b === "diners club") return "Diners";
    if (b === "jcb") return "JCB";
    if (b === "unionpay") return "UnionPay";
    return String(rawBrand).charAt(0).toUpperCase() + String(rawBrand).slice(1);
  };

  const formatCardLast4 = (pm) => {
    if (!pm) return "••••";
    const last4 = pm.last4 || pm.card?.last4 || pm.lastFour || pm.last_4 || "";
    if (!last4) return "••••";
    return `•••• •••• •••• ${last4}`;
  };

  const formatCardExpiry = (pm) => {
    if (!pm) return "—";
    const expMonth = pm.expMonth ?? pm.card?.expMonth ?? pm.exp_month ?? pm.card?.exp_month ?? pm.expiryMonth;
    const expYear = pm.expYear ?? pm.card?.expYear ?? pm.exp_year ?? pm.card?.exp_year ?? pm.expiryYear;
    if (expMonth && expYear) {
      const monthStr = String(expMonth).padStart(2, "0");
      const yearStr = String(expYear);
      return `${monthStr} / ${yearStr.length === 2 ? `20${yearStr}` : yearStr}`;
    }
    return "—";
  };

  const getCardholderName = () => {
    const user = getStoredUser();
    return (
      user?.fullName ||
      user?.name ||
      (user?.email ? user.email.split("@")[0] : "") ||
      "Cardholder"
    );
  };

  // Fetch current payment cards & default method
  const fetchPaymentMethod = async () => {
    try {
      setIsPaymentMethodLoading(true);
      setPaymentMethodError("");
      const cards = await getPaymentCards();
      if (Array.isArray(cards)) {
        setSavedCards(cards);
        if (cards.length > 0) {
          const primary = cards.find((c) => c?.isDefault) || cards[0];
          setSavedPaymentMethod(primary);
        } else {
          setSavedPaymentMethod(null);
        }
      } else if (cards && typeof cards === "object" && (cards.last4 || cards.brand || cards.id)) {
        setSavedCards([cards]);
        setSavedPaymentMethod(cards);
      } else {
        setSavedCards([]);
        setSavedPaymentMethod(null);
      }
    } catch (err) {
      if (err?.status !== 403 && err?.status !== 404) {
        console.warn("[PaymentMethodCard] Failed to fetch payment cards:", err);
      }
      setSavedCards([]);
      setSavedPaymentMethod(null);
    } finally {
      setIsPaymentMethodLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethod();
  }, []);

  // Set card as default
  const handleSetDefaultCard = async (paymentMethodId) => {
    if (!paymentMethodId || isSettingDefault) return;
    try {
      setIsSettingDefault(true);
      await setDefaultCard(paymentMethodId);
      await fetchPaymentMethod();
    } catch (err) {
      console.error("[PaymentMethodCard] Failed to set default card:", err);
    } finally {
      setIsSettingDefault(false);
    }
  };

  // Delete card handler
  const handleConfirmDeleteCard = async () => {
    if (!cardToDelete?.id || isDeletingCard) return;

    setIsDeletingCard(true);
    setDeleteError("");
    try {
      await deleteSavedCard(cardToDelete.id);
      setDeleteSuccessMessage("Card deleted successfully.");
      setCardToDelete(null);
      await fetchPaymentMethod();
      setTimeout(() => {
        setDeleteSuccessMessage("");
      }, 3500);
    } catch (err) {
      console.error("[PaymentMethodCard] Failed to delete card:", err);
      setDeleteError(err?.message || "Unable to delete card. Please try again.");
    } finally {
      setIsDeletingCard(false);
    }
  };

  // Open add card modal
  const handleOpenPaymentModal = async () => {
    setIsPaymentModalOpen(true);
    setSetupInitError("");
    setSetupClientSecret(null);
    setIsInitializingSetup(true);

    try {
      const publishableKey = await getStripePublishableKey();
      if (!publishableKey) {
        throw new Error("Stripe publishable key is not available.");
      }

      const stripeObj = await loadStripe(publishableKey);
      setSetupStripePromise(stripeObj);

      const secret = await createCardUpdateIntent();
      if (!secret) {
        throw new Error("Unable to prepare payment method update.");
      }

      setSetupClientSecret(secret);
    } catch (err) {
      console.error("[PaymentMethodCard] SetupIntent initialization failed:", err);
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
      console.warn("[PaymentMethodCard] Error refreshing payment method:", err);
    }
  };

  return (
    <>
      {/* Payment Method Card */}
      <div
        className={`bg-white rounded-[20px] border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.02)] flex flex-col gap-3.5 ${className}`}
      >
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
            {savedCards.length > 0 ? "Add another card" : "Add payment details"}
          </button>
        </div>

        {/* Success Alert after deleting card */}
        {deleteSuccessMessage && (
          <div className="p-3 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12.5px] font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{deleteSuccessMessage}</span>
          </div>
        )}

        {/* Card Details Box / List */}
        {isPaymentMethodLoading ? (
          <div className="p-3 rounded-[12px] border border-slate-100 bg-[#F8FAFC] flex items-center gap-3 animate-pulse">
            <div className="w-10 h-6 bg-slate-200 rounded-[6px]" />
            <div className="flex flex-col gap-1.5 flex-1">
              <div className="w-28 h-3.5 bg-slate-200 rounded" />
              <div className="w-16 h-2.5 bg-slate-200 rounded" />
            </div>
          </div>
        ) : paymentMethodError ? (
          <div className="p-3.5 rounded-[12px] border border-red-100 bg-red-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-600 text-[12.5px]">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Unable to load payment methods.</span>
            </div>
            <button
              type="button"
              onClick={fetchPaymentMethod}
              className="text-[12px] font-semibold text-red-700 hover:text-red-900 cursor-pointer underline"
            >
              Retry
            </button>
          </div>
        ) : savedCards.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {savedCards.map((card) => (
              <div
                key={card.id || card.last4}
                onClick={() => {
                  setSavedPaymentMethod(card);
                  setIsCardDetailsModalOpen(true);
                }}
                className="p-3 rounded-[12px] border border-slate-100 bg-[#F8FAFC] hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="px-2.5 py-1 rounded-[6px] bg-[#1E293B] text-white text-[10.5px] font-bold tracking-wider shrink-0 uppercase">
                    {card.brand || formatCardBrand(card)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#0F172A] truncate">
                        •••• {card.last4}
                      </span>
                      {card.isDefault && (
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#ECFDF5] text-[#059669] uppercase tracking-wide shrink-0">
                          Default
                        </span>
                      )}
                    </div>
                    {card.expMonth && card.expYear && (
                      <span className="text-[11px] text-[#94A3B8]">
                        Expires {String(card.expMonth).padStart(2, "0")}/{String(card.expYear).slice(-2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
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

      {/* Add / Update Card Modal with Stripe Elements */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[480px] rounded-[20px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex flex-col">
                <h3 className="text-[16.5px] font-bold text-[#0F172A]">
                  {savedCards.length > 0 ? "Add Another Card" : "Add Payment Method"}
                </h3>
                <span className="text-[12px] text-[#64748B]">
                  Enter your card details securely via Stripe
                </span>
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
                      style={{ background: "linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)" }}
                      className="px-5 py-2 rounded-[10px] text-white text-[13px] font-medium hover:opacity-95 transition-all cursor-pointer"
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

      {/* Card Details Modal */}
      {isCardDetailsModalOpen && savedPaymentMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[440px] rounded-[20px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex flex-col">
                <h3 className="text-[16.5px] font-bold text-[#0F172A]">
                  Payment Method Details
                </h3>
                <span className="text-[12px] text-[#64748B]">
                  Card on file for your account
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCardDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              >
                <svg
                  className="w-5 h-5 stroke-[2.5]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Basic Card Details Grid */}
            <div className="bg-slate-50 border border-slate-100 rounded-[14px] p-4 flex flex-col divide-y divide-slate-200/60 text-[13px]">
              <div className="flex items-center justify-between pb-2.5">
                <span className="text-slate-500 font-medium">Card Brand</span>
                <span className="font-bold text-[#0F172A]">
                  {formatCardBrand(savedPaymentMethod)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Card Number</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {formatCardLast4(savedPaymentMethod)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Cardholder Name</span>
                <span className="font-semibold text-[#0F172A]">
                  {getCardholderName()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Expiration Date</span>
                <span className="font-semibold text-[#0F172A]">
                  {formatCardExpiry(savedPaymentMethod)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-500 font-medium">Card Type</span>
                <span className="font-semibold text-[#0F172A]">
                  {savedPaymentMethod.funding
                    ? String(savedPaymentMethod.funding).charAt(0).toUpperCase() + String(savedPaymentMethod.funding).slice(1)
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2.5">
                <span className="text-slate-500 font-medium">Default Card</span>
                <span className="font-semibold text-[#0F172A]">
                  {savedPaymentMethod.isDefault ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsCardDetailsModalOpen(false)}
                className="px-4 py-2 rounded-[10px] border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-[13px] transition-colors cursor-pointer"
              >
                Close
              </button>
              {!savedPaymentMethod.isDefault && savedPaymentMethod.id && (
                <button
                  type="button"
                  disabled={isSettingDefault}
                  onClick={() => handleSetDefaultCard(savedPaymentMethod.id)}
                  className="px-4 py-2 rounded-[10px] border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium text-[13px] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSettingDefault ? "Updating..." : "Set as Default"}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsCardDetailsModalOpen(false);
                  setCardToDelete(savedPaymentMethod);
                  setDeleteError("");
                }}
                className="px-4 py-2 rounded-[10px] bg-red-600 hover:bg-red-700 text-white font-medium text-[13px] shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 stroke-current stroke-[2] fill-none" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Card Confirmation Modal */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-[400px] rounded-[20px] bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-4">
            {/* Icon + Title */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-5 h-5 stroke-current stroke-[2] fill-none" viewBox="0 0 24 24">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h3 className="text-[17px] font-bold text-[#0F172A]">
                  Delete card?
                </h3>
                <p className="text-[13px] text-[#64748B] mt-1 leading-normal">
                  Are you sure you want to remove <span className="font-semibold text-slate-800">{formatCardBrand(cardToDelete)} •••• {cardToDelete.last4}</span>?
                </p>
              </div>
            </div>

            {/* Error display if delete fails */}
            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                  <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                </svg>
                <span>{deleteError}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeletingCard}
                onClick={() => {
                  setCardToDelete(null);
                  setDeleteError("");
                }}
                className="px-4 py-2.5 rounded-[10px] border border-slate-200 hover:bg-slate-50 text-slate-700 text-[13px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCard}
                onClick={handleConfirmDeleteCard}
                className="px-5 py-2.5 rounded-[10px] bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingCard ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PaymentMethodCard;
