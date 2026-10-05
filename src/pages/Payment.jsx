import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import logoSrc from '../assets/Background.svg';
import {
    getStoredAuthToken,
    getBillingPlans,
    getStripePublishableKey,
    createPaymentIntent,
    confirmBackendPayment,
    getBillingStatus,
    getSavedCards,
    recoverBilling,
} from '../services/billingService';
import { getStoredUser } from '../services/authService';
import { checkUserHasResume } from '../services/resumeService';

/**
 * Card Brand Formatter
 */
const formatCardBrand = (brand) => {
    if (!brand) return 'Card';
    const b = String(brand).trim().toLowerCase();
    if (b === 'amex' || b === 'american express') return 'Amex';
    if (b === 'diners' || b === 'diners club') return 'Diners Club';
    if (b === 'jcb') return 'JCB';
    if (b === 'mastercard') return 'Mastercard';
    if (b === 'visa') return 'Visa';
    if (b === 'discover') return 'Discover';
    return b.charAt(0).toUpperCase() + b.slice(1);
};

/**
 * Card Expiry Formatter
 */
const formatCardExpiry = (month, year) => {
    if (!month || !year) return '';
    const m = String(month).padStart(2, '0');
    const y = String(year).slice(-2);
    return `Expires ${m}/${y}`;
};

/**
 * Helper to determine plan code from selected plan object
 */
const getPlanCode = (plan) => {
    if (plan?.code) return plan.code.toLowerCase().trim();
    const name = (plan?.name || '').toLowerCase();
    if (name.includes('pro') || plan?.price > 10) return 'pro';
    return 'basic';
};

/**
 * Inner Payment Form Component rendered within Stripe Elements context
 */
const PaymentFormContent = ({
    plan,
    clientSecret,
    paymentState,
    setPaymentState,
    errorMessage,
    setErrorMessage,
    onPaymentSuccess,
    lastPaymentIntentId,
    setLastPaymentIntentId,
}) => {
    const navigate = useNavigate();
    const stripe = useStripe();
    const elements = useElements();

    // Saved cards state
    const [savedCards, setSavedCards] = useState([]);
    const [isLoadingCards, setIsLoadingCards] = useState(true);
    const [cardsError, setCardsError] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Billing details state - initialize name from authenticated user if available
    const [formData, setFormData] = useState(() => {
        const user = getStoredUser();
        return {
            nameOnCard: user?.fullName || user?.name || '',
            streetAddress: '',
            city: '',
            zipCode: '',
            country: 'United States',
        };
    });

    const [errors, setErrors] = useState({});
    const [isRecovering, setIsRecovering] = useState(false);

    const pricingFeatures = [
        'Job discovery',
        'ATS matching',
        'Resume tailoring',
        'Automated applications',
        'Application tracking',
        'Dashboard & insights',
    ];

    const isSubmitting =
        paymentState === 'processingPayment' ||
        paymentState === 'confirmingBackend' ||
        paymentState === 'checkingStatus';

    // Fetch saved payment cards on load
    useEffect(() => {
        let isMounted = true;

        const loadSavedCards = async () => {
            setIsLoadingCards(true);
            setCardsError('');

            try {
                const cards = await getSavedCards();
                if (!isMounted) return;

                const validCards = Array.isArray(cards) ? cards : cards ? [cards] : [];
                setSavedCards(validCards);

                // Check for default card (ONLY card.isDefault === true)
                const defaultCard = validCards.find((c) => c?.isDefault === true);
                if (defaultCard && defaultCard.id) {
                    setSelectedPaymentMethod(defaultCard.id);
                } else {
                    setSelectedPaymentMethod(null);
                }
            } catch (err) {
                if (!isMounted) return;
                console.warn('[Payment] Unable to fetch saved cards:', err);
                setCardsError('Unable to load saved payment methods.');
                setSavedCards([]);
                setSelectedPaymentMethod(null);
            } finally {
                if (isMounted) {
                    setIsLoadingCards(false);
                }
            }
        };

        loadSavedCards();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
        if (errorMessage) {
            setErrorMessage('');
        }
    };

    const validateForm = () => {
        const newErrors = {};
        // Name on card is only required when using a new card
        if (!selectedPaymentMethod && !formData.nameOnCard.trim()) {
            newErrors.nameOnCard = 'Name on card is required';
        }
        if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP / Postal code is required';
        if (!formData.country.trim()) newErrors.country = 'Country is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Confirm Payment Flow
     */
    const handleConfirmPayment = async (e) => {
        if (e) e.preventDefault();

        // 1. Validate billing form fields
        if (!validateForm()) {
            return;
        }

        // 2. Check Stripe initialization
        if (!stripe || !clientSecret) {
            setErrorMessage('Payment gateway is initializing. Please wait a moment and try again.');
            return;
        }

        // If new card mode, Elements must also be available
        if (!selectedPaymentMethod && !elements) {
            setErrorMessage('Payment gateway is initializing. Please wait a moment and try again.');
            return;
        }

        setErrorMessage('');
        setPaymentState('processingPayment');

        try {
            let confirmedPaymentIntent = null;

            if (selectedPaymentMethod) {
                // FLOW A: Use saved Stripe PaymentMethod
                const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
                    clientSecret,
                    {
                        payment_method: selectedPaymentMethod,
                    }
                );

                if (confirmError) {
                    setErrorMessage(confirmError.message || 'Payment confirmation failed with Stripe.');
                    setPaymentState('readyForPayment');
                    return;
                }

                if (!paymentIntent || paymentIntent.status !== 'succeeded') {
                    if (paymentIntent?.status === 'requires_action') {
                        // Stripe will handle next action / 3DS automatically
                        return;
                    }
                    setErrorMessage(`Payment incomplete (Status: ${paymentIntent?.status || 'unknown'}).`);
                    setPaymentState('readyForPayment');
                    return;
                }

                confirmedPaymentIntent = paymentIntent;
            } else {
                // FLOW B: Use new card via Stripe PaymentElement
                const { error: submitError } = await elements.submit();
                if (submitError) {
                    setErrorMessage(submitError.message || 'Please check your card details.');
                    setPaymentState('readyForPayment');
                    return;
                }

                // Retrieve user details from stored user state for billing details
                const user = getStoredUser();
                const billingName =
                    formData.nameOnCard.trim() ||
                    user?.fullName ||
                    user?.name ||
                    (user?.email ? user.email.split('@')[0] : '') ||
                    'Cardholder';
                const billingEmail = user?.email || '';

                const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                    elements,
                    clientSecret,
                    confirmParams: {
                        return_url: `${window.location.origin}/dashboard`,
                        payment_method_data: {
                            billing_details: {
                                name: billingName,
                                email: billingEmail,
                            },
                        },
                    },
                    redirect: 'if_required',
                });

                if (confirmError) {
                    setErrorMessage(confirmError.message || 'Payment confirmation failed with Stripe.');
                    setPaymentState('readyForPayment');
                    return;
                }

                if (!paymentIntent || paymentIntent.status !== 'succeeded') {
                    if (paymentIntent?.status === 'requires_action') {
                        // Stripe will handle next action
                        return;
                    }
                    setErrorMessage(`Payment incomplete (Status: ${paymentIntent?.status || 'unknown'}).`);
                    setPaymentState('readyForPayment');
                    return;
                }

                confirmedPaymentIntent = paymentIntent;
            }

            // Capture confirmed Stripe PaymentIntent ID
            const confirmedId = confirmedPaymentIntent.id;
            setLastPaymentIntentId(confirmedId);

            // Backend Payment Confirmation (POST /api/billing/confirm-payment)
            setPaymentState('confirmingBackend');
            try {
                await confirmBackendPayment(confirmedId);
            } catch (backendErr) {
                console.error('Backend payment confirmation failed:', backendErr);
                setPaymentState('recovery');
                setErrorMessage(
                    'Your card was charged, but activating your plan timed out. Please click "Recover Plan Activation" below to finalize.'
                );
                return;
            }

            // Verify Billing Status (GET /api/billing/status)
            setPaymentState('checkingStatus');
            try {
                const status = await getBillingStatus();
                if (status?.hasPlan) {
                    onPaymentSuccess(status);
                } else {
                    setPaymentState('recovery');
                    setErrorMessage(
                        'Payment was processed, but application quota is updating. Click "Recover Plan Activation" to complete.'
                    );
                }
            } catch (statusErr) {
                console.error('Failed to verify billing status:', statusErr);
                setPaymentState('recovery');
                setErrorMessage(
                    'Payment succeeded! Click "Recover Plan Activation" to verify your subscription.'
                );
            }
        } catch (err) {
            console.error('Payment execution error:', err);
            setErrorMessage(err?.message || 'An unexpected error occurred during checkout.');
            setPaymentState('readyForPayment');
        }
    };

    /**
     * Recovery Handler
     */
    const handleRecovery = async () => {
        setIsRecovering(true);
        setErrorMessage('');
        try {
            await recoverBilling();
            const status = await getBillingStatus();
            if (status?.hasPlan) {
                onPaymentSuccess(status);
            } else {
                setErrorMessage('Unable to recover recent plan activation yet. Please try again shortly or contact support.');
            }
        } catch (err) {
            setErrorMessage(err?.message || 'Recovery request failed. Please try again.');
        } finally {
            setIsRecovering(false);
        }
    };

    // Find currently selected card object if in saved-card mode
    const activeSelectedCard = selectedPaymentMethod
        ? savedCards.find((c) => c.id === selectedPaymentMethod)
        : null;

    return (
        <div className="w-full max-w-7xl lg:max-w-[1380px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* LEFT CARD: PAYMENT METHOD & BILLING ADDRESS */}
            <div className="lg:col-span-7 min-w-0 w-full bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 lg:p-10 box-border">
                <form onSubmit={handleConfirmPayment} noValidate className="w-full min-w-0">
                    {/* Section 1: Payment method */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                                Payment method
                            </h2>
                            {isLoadingCards && (
                                <span className="text-xs text-slate-400">
                                    Loading existing payment methods...
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500">
                            {selectedPaymentMethod
                                ? 'Pay with your existing card on file or choose another payment method.'
                                : 'Enter your card details to complete the payment.'}
                        </p>
                    </div>

                    {/* Non-blocking error for existing cards fetch */}
                    {cardsError && (
                        <div className="mb-5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                            <svg className="w-4 h-4 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" />
                                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2" />
                            </svg>
                            <span>{cardsError}</span>
                        </div>
                    )}

                    {/* LOADING SKELETON WHILE FETCHING EXISTING CARDS */}
                    {isLoadingCards ? (
                        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 animate-pulse flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-7 bg-slate-200 rounded-md" />
                                    <div className="flex flex-col gap-1.5">
                                        <div className="w-32 h-4 bg-slate-200 rounded" />
                                        <div className="w-20 h-3 bg-slate-200 rounded" />
                                    </div>
                                </div>
                                <div className="w-28 h-4 bg-slate-200 rounded" />
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* EXISTING CARDS SELECTOR / BANNER */}
                            {savedCards.length > 0 && (
                                <div className="mb-6">
                                    {selectedPaymentMethod && activeSelectedCard ? (
                                        /* SELECTED EXISTING CARD DISPLAY */
                                        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <svg className="w-4 h-4 stroke-current stroke-[3] fill-none" viewBox="0 0 24 24">
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <div className="px-2 py-0.5 rounded bg-[#1E293B] text-white text-[10px] font-bold uppercase tracking-wider">
                                                                {formatCardBrand(activeSelectedCard.brand)}
                                                            </div>
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                •••• {activeSelectedCard.last4}
                                                            </span>
                                                            {activeSelectedCard.isDefault && (
                                                                <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#ECFDF5] text-[#059669] uppercase tracking-wide">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </div>
                                                        {activeSelectedCard.expMonth && activeSelectedCard.expYear && (
                                                            <span className="text-xs text-slate-500 mt-1">
                                                                {formatCardExpiry(activeSelectedCard.expMonth, activeSelectedCard.expYear)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                    className="text-xs sm:text-sm font-semibold text-[#4F46E5] hover:text-indigo-700 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-indigo-50/50"
                                                >
                                                    {isDropdownOpen ? 'Close' : 'Change payment method'}
                                                </button>
                                            </div>

                                            {/* DROPDOWN MENU */}
                                            {isDropdownOpen && (
                                                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col gap-2.5">
                                                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                                        Select payment method
                                                    </span>
                                                    {savedCards.map((card) => {
                                                        const isSelected = selectedPaymentMethod === card.id;
                                                        return (
                                                            <button
                                                                key={card.id || card.last4}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedPaymentMethod(card.id);
                                                                    setIsDropdownOpen(false);
                                                                }}
                                                                className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                                                                    isSelected
                                                                        ? 'border-[#4F46E5] bg-indigo-50/60 shadow-xs'
                                                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div
                                                                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                                                            isSelected
                                                                                ? 'border-[#4F46E5] bg-white'
                                                                                : 'border-slate-300'
                                                                        }`}
                                                                    >
                                                                        {isSelected && (
                                                                            <div className="w-2 h-2 rounded-full bg-[#4F46E5]" />
                                                                        )}
                                                                    </div>
                                                                    <div className="px-2 py-0.5 rounded bg-[#1E293B] text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                                                                        {formatCardBrand(card.brand)}
                                                                    </div>
                                                                    <span className="text-sm font-semibold text-slate-900 truncate">
                                                                        •••• {card.last4}
                                                                    </span>
                                                                    {card.isDefault && (
                                                                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-[#ECFDF5] text-[#059669] uppercase tracking-wide shrink-0">
                                                                            Default
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {card.expMonth && card.expYear && (
                                                                    <span className="text-xs text-slate-500 font-medium shrink-0 ml-2">
                                                                        {formatCardExpiry(card.expMonth, card.expYear)}
                                                                    </span>
                                                                )}
                                                            </button>
                                                        );
                                                    })}

                                                    {/* Option: + Use a new card */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedPaymentMethod(null);
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="w-full text-left p-3.5 rounded-xl border border-dashed border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center gap-2.5 transition-all cursor-pointer"
                                                    >
                                                        <div className="w-4 h-4 rounded-full border border-slate-400 flex items-center justify-center shrink-0">
                                                            <span className="text-xs font-bold leading-none text-slate-600">+</span>
                                                        </div>
                                                        <span>+ Use a new card</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        /* "USE A NEW CARD" ACTIVE WITH EXISTING CARDS AVAILABLE */
                                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                                                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.8" />
                                                    <line x1="2" y1="10" x2="22" y2="10" strokeWidth="1.8" />
                                                </svg>
                                                <span className="font-medium">Using a new card</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const defaultCard = savedCards.find((c) => c.isDefault) || savedCards[0];
                                                    if (defaultCard?.id) {
                                                        setSelectedPaymentMethod(defaultCard.id);
                                                    }
                                                }}
                                                className="text-xs sm:text-sm font-semibold text-[#4F46E5] hover:text-indigo-700 transition-colors cursor-pointer"
                                            >
                                                Use existing card ({savedCards.length})
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* NEW CARD FIELDS (Name on card + PaymentElement) - Only visible when selectedPaymentMethod === null */}
                            {!selectedPaymentMethod && (
                                <>
                                    {/* Name on Card */}
                                    <div className="flex flex-col gap-1.5 mb-5 w-full">
                                        <label
                                            htmlFor="nameOnCard"
                                            className="text-[13.5px] font-semibold text-slate-700"
                                        >
                                            Name on card
                                        </label>
                                        <input
                                            id="nameOnCard"
                                            name="nameOnCard"
                                            type="text"
                                            placeholder="Jane Doe"
                                            value={formData.nameOnCard}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                            className={`w-full h-11 px-3.5 text-sm font-medium text-slate-900 bg-white border rounded-xl outline-none transition-all ${
                                                errors.nameOnCard
                                                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/15'
                                                    : 'border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15'
                                            }`}
                                        />
                                        {errors.nameOnCard && (
                                            <span className="text-xs text-red-500 mt-0.5">
                                                {errors.nameOnCard}
                                            </span>
                                        )}
                                    </div>

                                    {/* Stripe Payment Element */}
                                    <div className="flex flex-col gap-1.5 mb-6 w-full min-w-0">
                                        <label className="text-[13.5px] font-semibold text-slate-700">
                                            Card details
                                        </label>
                                        <div className="w-full min-w-0 rounded-xl box-border py-0.5">
                                            <PaymentElement
                                                id="payment-element"
                                                options={{
                                                    layout: 'tabs',
                                                    paymentMethodOrder: ['card'],
                                                    wallets: {
                                                        applePay: 'never',
                                                        googlePay: 'never',
                                                    },
                                                    fields: {
                                                        billingDetails: {
                                                            name: 'never',
                                                            email: 'never',
                                                        },
                                                    },
                                                    terms: {
                                                        card: 'never',
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* Divider */}
                    <div className="w-full h-px bg-slate-200 my-6" />

                    {/* Section 2: Billing address */}
                    <div className="mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                            Billing address
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Enter your billing address as it appears on your card statement.
                        </p>
                    </div>

                    {/* Street Address */}
                    <div className="flex flex-col gap-1.5 mb-4 w-full">
                        <label
                            htmlFor="streetAddress"
                            className="text-[13.5px] font-semibold text-slate-700"
                        >
                            Street address
                        </label>
                        <input
                            id="streetAddress"
                            name="streetAddress"
                            type="text"
                            placeholder="123 Main Street, Apt 4B"
                            value={formData.streetAddress}
                            onChange={handleInputChange}
                            disabled={isSubmitting}
                            className={`w-full h-11 px-3.5 text-sm font-medium text-slate-900 bg-white border rounded-xl outline-none transition-all ${
                                errors.streetAddress
                                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/15'
                                    : 'border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15'
                            }`}
                        />
                        {errors.streetAddress && (
                            <span className="text-xs text-red-500 mt-0.5">
                                {errors.streetAddress}
                            </span>
                        )}
                    </div>

                    {/* City & ZIP */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 w-full">
                        <div className="flex flex-col gap-1.5 w-full">
                            <label
                                htmlFor="city"
                                className="text-[13.5px] font-semibold text-slate-700"
                            >
                                City
                            </label>
                            <input
                                id="city"
                                name="city"
                                type="text"
                                placeholder="San Francisco"
                                value={formData.city}
                                onChange={handleInputChange}
                                disabled={isSubmitting}
                                className={`w-full h-11 px-3.5 text-sm font-medium text-slate-900 bg-white border rounded-xl outline-none transition-all ${
                                    errors.city
                                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/15'
                                        : 'border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15'
                                }`}
                            />
                            {errors.city && (
                                <span className="text-xs text-red-500 mt-0.5">
                                    {errors.city}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5 w-full">
                            <label
                                htmlFor="zipCode"
                                className="text-[13.5px] font-semibold text-slate-700"
                            >
                                ZIP / Postal code
                            </label>
                            <input
                                id="zipCode"
                                name="zipCode"
                                type="text"
                                placeholder="94105"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                disabled={isSubmitting}
                                className={`w-full h-11 px-3.5 text-sm font-medium text-slate-900 bg-white border rounded-xl outline-none transition-all ${
                                    errors.zipCode
                                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/15'
                                        : 'border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15'
                                }`}
                            />
                            {errors.zipCode && (
                                <span className="text-xs text-red-500 mt-0.5">
                                    {errors.zipCode}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Country */}
                    <div className="flex flex-col gap-1.5 mb-2 w-full">
                        <label
                            htmlFor="country"
                            className="text-[13.5px] font-semibold text-slate-700"
                        >
                            Country
                        </label>
                        <select
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            disabled={isSubmitting}
                            className={`w-full h-11 px-3.5 text-sm font-medium text-slate-900 bg-white border rounded-xl outline-none transition-all cursor-pointer ${
                                errors.country
                                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/15'
                                    : 'border-slate-200 focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/15'
                            }`}
                        >
                            <option value="United States">United States</option>
                            <option value="Canada">Canada</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Australia">Australia</option>
                            <option value="Germany">Germany</option>
                            <option value="France">France</option>
                            <option value="India">India</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Japan">Japan</option>
                            <option value="Other">Other</option>
                        </select>
                        {errors.country && (
                            <span className="text-xs text-red-500 mt-0.5">
                                {errors.country}
                            </span>
                        )}
                    </div>

                    {/* Error Alert */}
                    {errorMessage && (
                        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2.5">
                            <svg
                                viewBox="0 0 24 24"
                                className="w-4 h-4 text-red-600 shrink-0"
                                stroke="currentColor"
                                fill="none"
                                strokeWidth="2"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Recovery Action Banner */}
                    {paymentState === 'recovery' && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2.5">
                            <p className="text-xs sm:text-sm text-amber-800 font-medium">
                                If you were charged, click below to verify and activate your subscription without paying again.
                            </p>
                            <button
                                type="button"
                                onClick={handleRecovery}
                                disabled={isRecovering}
                                className="h-10 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm transition-colors self-start cursor-pointer disabled:opacity-75"
                            >
                                {isRecovering ? 'Recovering...' : 'Recover Plan Activation'}
                            </button>
                        </div>
                    )}
                </form>
            </div>

            {/* RIGHT CARD: ORDER SUMMARY */}
            <div className="lg:col-span-5 min-w-0 w-full bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-8 lg:p-10 box-border flex flex-col">
                {/* Back to plans button */}
                <button
                    type="button"
                    onClick={() => navigate('/plan')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F46E5] hover:text-indigo-700 transition-colors mb-5 cursor-pointer self-start"
                    aria-label="Back to pricing plans"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="w-4 h-4 stroke-[2.5]"
                        stroke="currentColor"
                        fill="none"
                    >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    <span>Back to plans</span>
                </button>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
                    Order summary
                </h2>

                {/* Selected Plan Box */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 mb-5 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
                        <span className="font-extrabold text-xl text-slate-900">
                            ${plan.price.toFixed(2)}
                        </span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">
                        {plan.billing ? plan.billing.replace('/', 'Per ').trim() : ''}
                    </span>
                    <p className="text-xs font-semibold text-[#4F46E5] mt-0.5">
                        {plan.applications}
                    </p>
                </div>

                {/* Features List */}
                <ul className="flex flex-col gap-3 mb-6 list-none p-0">
                    {pricingFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2.5">
                            <div className="w-[18px] h-[18px] rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                <svg
                                    viewBox="0 0 24 24"
                                    className="w-2.5 h-2.5 stroke-white stroke-[3] fill-none"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>

                {/* Divider */}
                <div className="w-full h-px bg-slate-200 my-5" />

                {/* Total Due Today */}
                <div className="flex items-baseline justify-between mb-6">
                    <span className="text-sm sm:text-base font-semibold text-slate-500">
                        Total due today
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                        ${plan.price.toFixed(2)}
                    </span>
                </div>

                {/* Confirm Payment Button */}
                <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={isSubmitting || paymentState === 'recovery'}
                    className="w-full h-12 sm:h-[50px] rounded-xl bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#1D4ED8] hover:from-[#1D4ED8] hover:via-[#4338CA] hover:to-[#1E40AF] text-white font-bold text-sm sm:text-base shadow-[0px_4px_12px_rgba(79,70,229,0.35)] hover:shadow-[0px_6px_20px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0 mb-4"
                >
                    {isSubmitting ? (
                        <>
                            <svg
                                className="w-4 h-4 animate-spin text-white"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeDasharray="32"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span>
                                {paymentState === 'processingPayment'
                                    ? 'Processing payment...'
                                    : paymentState === 'confirmingBackend'
                                    ? 'Activating subscription...'
                                    : 'Verifying credits...'}
                            </span>
                        </>
                    ) : (
                        <>
                            <svg
                                viewBox="0 0 24 24"
                                className="w-4 h-4 stroke-current stroke-[2.2] fill-none"
                            >
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <span>Confirm Payment - ${plan.price.toFixed(2)}</span>
                        </>
                    )}
                </button>

                {/* Security Notice */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 text-center">
                    <svg
                        viewBox="0 0 24 24"
                        className="w-3.5 h-3.5 stroke-emerald-500 stroke-[2.2] fill-none"
                    >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span>Secured with 256-bit encryption</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Main Payment Page Wrapper
 */
const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const plan = location.state;

    // Authentication check
    const token = getStoredAuthToken();
    const currentUser = getStoredUser();
    const currentEmail = currentUser?.email || '';

    // State machine: 'loadingInit' | 'readyForPayment' | 'processingPayment' | 'confirmingBackend' | 'checkingStatus' | 'success' | 'recovery' | 'error'
    const [paymentState, setPaymentState] = useState('loadingInit');
    const [stripePromise, setStripePromise] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [lastPaymentIntentId, setLastPaymentIntentId] = useState(null);
    const [billingStatusData, setBillingStatusData] = useState(null);
    const [hasUserResume, setHasUserResume] = useState(false);
    const [paymentSessionId, setPaymentSessionId] = useState('');

    // Track active effect run to handle StrictMode cleanly without blocking
    const effectIdRef = useRef(0);

    // When payment succeeds, check if the user already has a resume
    useEffect(() => {
        if (paymentState === 'success') {
            checkUserHasResume().then((hasResume) => {
                setHasUserResume(Boolean(hasResume));
            }).catch(() => {
                setHasUserResume(false);
            });
        }
    }, [paymentState]);

    const handlePaymentSuccessContinue = () => {
        navigate('/dashboard');
    };

    // Fallback: If no plan in state, redirect to /plan
    if (!plan || !plan.name || typeof plan.price !== 'number') {
        return <Navigate to="/plan" replace />;
    }

    // Step 1 - Step 3: Initialize Stripe Key and create fresh PaymentIntent for selected plan & current user
    useEffect(() => {
        const effectId = ++effectIdRef.current;
        const currentToken = getStoredAuthToken();
        const user = getStoredUser();
        const planCode = getPlanCode(plan);

        // Always reset previous state to avoid cross-user or cross-plan state retention
        setClientSecret(null);
        setStripePromise(null);
        setLastPaymentIntentId(null);
        setErrorMessage('');
        setPaymentState('loadingInit');

        // Generate a fresh in-memory session identifier for Elements remounting
        const freshSessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
        setPaymentSessionId(freshSessionId);

        if (!currentToken) {
            setErrorMessage('You must be signed in to complete checkout.');
            setPaymentState('error');
            return;
        }

        const initializeCheckout = async () => {
            try {
                // 1. Fetch plans (contract flow)
                try {
                    await getBillingPlans();
                } catch (plansErr) {
                    console.debug('[billing] plans check:', plansErr?.message);
                }
                if (effectId !== effectIdRef.current) return;

                // 2. Fetch Stripe Publishable Key
                const publishableKey = await getStripePublishableKey();
                if (effectId !== effectIdRef.current) return;

                if (!publishableKey) {
                    throw new Error('Stripe publishable key is not available. Please verify server configuration.');
                }

                // 3. Load Stripe.js instance
                const stripeObj = await loadStripe(publishableKey);
                if (effectId !== effectIdRef.current) return;

                // 4. Create fresh PaymentIntent with exact Plancode for currently authenticated user
                const secret = await createPaymentIntent(planCode);
                if (effectId !== effectIdRef.current) return;

                if (!secret) {
                    throw new Error('Failed to create payment intent client secret.');
                }

                setStripePromise(stripeObj);
                setClientSecret(secret);
                setPaymentState('readyForPayment');
            } catch (err) {
                console.error('Checkout initialization failed:', err);
                if (effectId === effectIdRef.current) {
                    setErrorMessage(err?.message || 'Unable to prepare secure checkout. Please try again.');
                    setPaymentState('error');
                }
            }
        };

        initializeCheckout();

        return () => {
            // Cancel / cleanup
        };
    }, [plan, currentEmail]);

    // Stripe Elements options configured with the backend clientSecret
    const elementsOptions = useMemo(() => {
        if (!clientSecret) return null;
        return {
            clientSecret,
            appearance: {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#4F46E5',
                    colorBackground: '#FFFFFF',
                    colorText: '#0F172A',
                    colorDanger: '#EF4444',
                    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    borderRadius: '12px',
                    fontSizeBase: '14.5px',
                    spacingUnit: '4px',
                    spacingGridRow: '14px',
                },
                rules: {
                    '.Input': {
                        border: '1px solid #E2E8F0',
                        boxShadow: 'none',
                        padding: '11px 14px',
                        fontSize: '14px',
                        color: '#0F172A',
                        borderRadius: '12px',
                    },
                    '.Input:focus': {
                        border: '1px solid #4F46E5',
                        boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.15)',
                    },
                    '.Input--invalid': {
                        border: '1px solid #EF4444',
                    },
                    '.Label': {
                        fontWeight: '600',
                        fontSize: '13.5px',
                        color: '#334155',
                        marginBottom: '6px',
                    },
                    '.Block': {
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                        padding: '14px',
                    },
                },
            },
        };
    }, [clientSecret]);

    const handlePaymentSuccess = (status) => {
        setBillingStatusData(status);
        setPaymentState('success');
    };

    return (
        <div className="min-h-screen w-full bg-[#F5F3FF] flex flex-col items-center pt-8 sm:pt-10 lg:pt-12 pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8 xl:px-12 font-['Plus_Jakarta_Sans',sans-serif] box-border overflow-x-hidden">
            {/* TOP BRAND HEADER */}
            <header className="w-full flex justify-center items-center mb-6 sm:mb-8">
                <a
                    href="/"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                    }}
                    className="inline-flex items-center gap-2.5 sm:gap-3 text-decoration-none cursor-pointer"
                    aria-label="Auto Jobs Apply Homepage"
                >
                    <img
                        src={logoSrc}
                        alt="Auto Jobs Apply Logo"
                        className="w-9 h-9 sm:w-10 sm:h-10 object-contain"
                    />
                    <span className="font-bold text-xl sm:text-2xl text-[#00509F] tracking-tight">
                        Auto Jobs Apply
                    </span>
                </a>
            </header>

            {/* PAGE HEADER */}
            <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center mb-8 sm:mb-10 lg:mb-12 px-4 box-border">
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-[#EEF2FF] border border-[#DDE5FF] text-[#4F46E5] mb-3 sm:mb-4">
                    PAYMENT
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold text-[#0F172A] tracking-tight leading-tight sm:leading-[1.15] mb-2 sm:mb-3 text-center">
                    Complete your{' '}
                    <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
                        purchase
                    </span>
                </h1>
                <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed text-center">
                    You're one step away from supercharging your job search.
                </p>
            </div>

            {/* AUTH WARNING IF NOT LOGGED IN */}
            {!token && (
                <div className="w-full max-w-xl mx-auto mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                    <p className="text-amber-900 font-semibold mb-3 text-sm">
                        You need to be logged in to your account before completing payment.
                    </p>
                    <Link
                        to="/login"
                        state={{ returnTo: '/payment', plan }}
                        className="inline-block px-5 py-2.5 rounded-xl bg-[#4F46E5] text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
                    >
                        Sign in to continue
                    </Link>
                </div>
            )}

            {/* FINAL SUCCESS UI */}
            {paymentState === 'success' ? (
                <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-10 text-center flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                        <svg className="w-8 h-8 stroke-current stroke-[2.5]" fill="none" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                        Payment Successful!
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md">
                        Your subscription for <span className="font-semibold text-slate-900">{plan.name}</span> is now active.
                    </p>

                    <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Plan Activated:</span>
                            <span className="font-bold text-slate-900">{plan.name}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 font-medium">Applications Available:</span>
                            <span className="font-bold text-[#4F46E5]">
                                {billingStatusData?.remainingApplications || plan.applications}
                            </span>
                        </div>
                        {lastPaymentIntentId && (
                            <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-200">
                                <span>Reference ID:</span>
                                <span className="font-mono">{lastPaymentIntentId}</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={handlePaymentSuccessContinue}
                        className="w-full sm:w-auto px-8 h-12 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#4F46E5] to-[#1D4ED8] hover:from-[#1D4ED8] hover:via-[#4338CA] hover:to-[#1E40AF] text-white font-bold text-sm sm:text-base shadow-md transition-all cursor-pointer"
                    >
                        {!hasUserResume ? 'Continue to Resume Setup' : 'Go to Dashboard'}
                    </button>
                </div>
            ) : paymentState === 'loadingInit' ? (
                /* LOADING PAYMENT GATEWAY */
                <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-sm p-12 text-center flex flex-col items-center gap-4">
                    <svg
                        className="w-8 h-8 animate-spin text-[#4F46E5]"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray="32"
                            strokeLinecap="round"
                        />
                    </svg>
                    <p className="text-sm font-semibold text-slate-700">
                        Preparing secure checkout for {plan.name}...
                    </p>
                </div>
            ) : paymentState === 'error' && !clientSecret ? (
                /* ERROR STATE WHEN INTENT INITIALIZATION FAILS */
                <div className="w-full max-w-xl mx-auto bg-white rounded-3xl border border-red-200 shadow-sm p-8 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <svg className="w-6 h-6 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                        Checkout Unavailable
                    </h3>
                    <p className="text-sm text-slate-600 max-w-md">
                        {errorMessage || 'Unable to start checkout session. Please try again or contact support.'}
                    </p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 rounded-xl bg-[#4F46E5] text-white font-semibold text-sm hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                /* ACTIVE STRIPE CHECKOUT FORM */
                stripePromise && elementsOptions && (
                    <Elements
                        stripe={stripePromise}
                        options={elementsOptions}
                        key={`${paymentSessionId}_${clientSecret}`}
                    >
                        <PaymentFormContent
                            plan={plan}
                            clientSecret={clientSecret}
                            paymentState={paymentState}
                            setPaymentState={setPaymentState}
                            errorMessage={errorMessage}
                            setErrorMessage={setErrorMessage}
                            onPaymentSuccess={handlePaymentSuccess}
                            lastPaymentIntentId={lastPaymentIntentId}
                            setLastPaymentIntentId={setLastPaymentIntentId}
                        />
                    </Elements>
                )
            )}
        </div>
    );
};

export default Payment;
