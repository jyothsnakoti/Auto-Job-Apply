import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';

const Payment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const plan = location.state;

    // Window size for responsiveness
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );
    

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    // Form state
    const [formData, setFormData] = useState({
        nameOnCard: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
        streetAddress: '',
        city: '',
        zipCode: '',
        country: 'United States',
    });

    const [errors, setErrors] = useState({});
    const [isHoveredPay, setIsHoveredPay] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Fallback: If no plan in state, redirect to /plan
    if (!plan || !plan.name || !plan.price) {
        return <Navigate to="/plan" replace />;
    }

    const formatCardNumber = (value) => {
        const cleaned = value.replace(/\D/g, '');
        const matches = cleaned.substring(0, 16).match(/.{1,4}/g);
        return matches ? matches.join(' ') : cleaned;
    };

    const formatExpiry = (value) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length >= 2) {
            return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
        }
        return cleaned;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'cardNumber') {
            formattedValue = formatCardNumber(value);
        } else if (name === 'expiry') {
            formattedValue = formatExpiry(value);
        } else if (name === 'cvv') {
            formattedValue = value.replace(/\D/g, '').substring(0, 4);
        }

        setFormData((prev) => ({ ...prev, [name]: formattedValue }));

        // Clear field error on change
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.nameOnCard.trim()) newErrors.nameOnCard = 'Name on card is required';
        if (!formData.cardNumber.trim() || formData.cardNumber.replace(/\s/g, '').length < 15) {
            newErrors.cardNumber = 'Valid card number is required';
        }
        if (!formData.expiry.trim() || formData.expiry.length < 5) {
            newErrors.expiry = 'Valid expiry date required (MM/YY)';
        }
        if (!formData.cvv.trim() || formData.cvv.length < 3) {
            newErrors.cvv = 'Valid CVV required';
        }
        if (!formData.streetAddress.trim()) newErrors.streetAddress = 'Street address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP / Postal code is required';
        if (!formData.country.trim()) newErrors.country = 'Country is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        // Isolated simulation (gateway placeholder)
        setTimeout(() => {
            setIsSubmitting(false);
            setPaymentSuccess(true);
        }, 1200);
    };

    const pricingFeatures = [
        'Job discovery',
        'ATS matching',
        'Resume tailoring',
        'Automated applications',
        'Application tracking',
        'Dashboard & insights',
    ];

    const styles = {
        page: {
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#F5F3FF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            boxSizing: 'border-box',
            paddingTop: 'clamp(32px, 3.2vw, 56px)',
            paddingBottom: 'clamp(60px, 6vw, 100px)',
            paddingLeft: isMobile ? '16px' : isTablet ? '28px' : 'clamp(28px, 3.5vw, 60px)',
            paddingRight: isMobile ? '16px' : isTablet ? '28px' : 'clamp(28px, 3.5vw, 60px)',
        },
        headerArea: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 'clamp(24px, 2.2vw, 36px)',
        },
        brandLink: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'clamp(10px, 0.9vw, 14px)',
            textDecoration: 'none',
            cursor: 'pointer',
        },
        logoImg: {
            width: 'clamp(36px, 2.5vw, 46px)',
            height: 'clamp(36px, 2.5vw, 46px)',
            objectFit: 'contain',
        },
        brandText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(22px, 1.7vw, 28px)',
            lineHeight: '1.2',
            color: '#00509F',
            letterSpacing: '-0.02em',
        },
        titleSection: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            marginBottom: 'clamp(36px, 3.2vw, 52px)',
        },
        badge: {
            backgroundColor: '#EEF2FF',
            border: '1px solid #DDE5FF',
            borderRadius: '9999px',
            padding: '5px 15px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '700',
            fontSize: '12px',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: '#4F46E5',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(12px, 1vw, 16px)',
        },
        heading: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 'clamp(32px, 2.8vw, 48px)',
            fontWeight: '800',
            lineHeight: '1.12',
            letterSpacing: '-0.025em',
            color: '#0F172A',
            margin: '0 0 clamp(8px, 0.8vw, 12px) 0',
            textAlign: 'center',
        },
        headingPurchase: {
            background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
        },
        subtitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 'clamp(15px, 0.95vw, 17.5px)',
            lineHeight: 'clamp(22px, 1.5vw, 26px)',
            fontWeight: '400',
            color: '#64748B',
            margin: 0,
            maxWidth: '650px',
            textAlign: 'center',
        },
        mainContainer: {
            width: '100%',
            maxWidth: '1380px',
            display: 'grid',
            gridTemplateColumns: isDesktop ? '1.45fr 0.92fr' : '1fr',
            gap: 'clamp(24px, 2.2vw, 36px)',
            alignItems: 'start',
            boxSizing: 'border-box',
        },
        card: {
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.05)',
            boxSizing: 'border-box',
        },
        leftCard: {
            padding: 'clamp(26px, 2.4vw, 38px)',
        },
        rightCard: {
            padding: 'clamp(24px, 2.2vw, 34px)',
            display: 'flex',
            flexDirection: 'column',
        },
        sectionHeading: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(19px, 1.3vw, 22px)',
            lineHeight: '1.25',
            color: '#0F172A',
            margin: '0 0 6px 0',
        },
        sectionDesc: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14.5px',
            lineHeight: '22px',
            color: '#64748B',
            margin: '0 0 clamp(20px, 1.8vw, 26px) 0',
        },
        formGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginBottom: '18px',
            width: '100%',
            boxSizing: 'border-box',
        },
        label: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13.5px',
            fontWeight: '600',
            color: '#334155',
        },
        inputWrapper: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width: '100%',
        },
        input: (hasError) => ({
            width: '100%',
            height: '46px',
            backgroundColor: '#FFFFFF',
            border: hasError ? '1px solid #EF4444' : '1px solid #DCE3EF',
            borderRadius: '11px',
            padding: '0 14px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15px',
            color: '#0F172A',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            boxSizing: 'border-box',
        }),
        select: (hasError) => ({
            width: '100%',
            height: '46px',
            backgroundColor: '#FFFFFF',
            border: hasError ? '1px solid #EF4444' : '1px solid #DCE3EF',
            borderRadius: '11px',
            padding: '0 14px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15px',
            color: '#0F172A',
            outline: 'none',
            cursor: 'pointer',
            boxSizing: 'border-box',
        }),
        errorText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12px',
            color: '#EF4444',
            marginTop: '2px',
        },
        twoColGrid: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '16px',
            width: '100%',
            boxSizing: 'border-box',
        },
        divider: {
            width: '100%',
            height: '1px',
            backgroundColor: '#E2E8F0',
            margin: 'clamp(24px, 2vw, 32px) 0',
        },
        // Right Summary Specifics
        backButton: {
            background: 'none',
            border: 'none',
            color: '#4F46E5',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '600',
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            padding: 0,
            marginBottom: '20px',
            alignSelf: 'flex-start',
            transition: 'opacity 0.2s ease',
        },
        planBox: {
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '22px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
        },
        planHeaderRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        planNameText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '700',
            fontSize: '19px',
            color: '#0F172A',
            margin: 0,
        },
        planPriceText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '800',
            fontSize: '22px',
            color: '#0F172A',
            margin: 0,
        },
        planPeriodText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13.5px',
            color: '#64748B',
            fontWeight: '500',
        },
        planAppLimit: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            color: '#4F46E5',
            margin: '2px 0 0 0',
        },
        summaryFeaturesList: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            margin: '0 0 24px 0',
            padding: 0,
            listStyle: 'none',
        },
        summaryFeatureItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        checkIcon: {
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        checkSvg: {
            width: '10px',
            height: '10px',
            stroke: '#FFFFFF',
            strokeWidth: '3',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        featureText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14.5px',
            fontWeight: '500',
            color: '#334155',
        },
        totalRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            margin: '0 0 22px 0',
        },
        totalLabel: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            color: '#64748B',
        },
        totalAmount: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 'clamp(26px, 2vw, 32px)',
            fontWeight: '800',
            color: '#0F172A',
        },
        payBtn: (isHovered) => ({
            width: '100%',
            height: '52px',
            borderRadius: '12px',
            backgroundColor: isHovered ? 'rgba(67, 56, 202, 1)' : '#4F46E5',
            background: 'linear-gradient(90deg, #2563EB 0%, #4F46E5 50%, #1D4ED8 100%)',
            backgroundSize: '200% 100%',
            backgroundPosition: isHovered ? '100% 0' : '0 0',
            color: '#FFFFFF',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '700',
            fontSize: '16px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '9px',
            boxShadow: isHovered
                ? '0 10px 25px -4px rgba(37, 99, 235, 0.48), 0 4px 12px -2px rgba(79, 70, 229, 0.4)'
                : '0px 2px 4px -2px rgba(79, 70, 229, 0.3), 0px 4px 6px -1px rgba(79, 70, 229, 0.3)',
            transform: isHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            marginBottom: '16px',
        }),
        lockSvg: {
            width: '17px',
            height: '17px',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2.2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        securityText: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#64748B',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
        },
        shieldSvg: {
            width: '14px',
            height: '14px',
            fill: 'none',
            stroke: '#10B981',
            strokeWidth: '2.2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
    };

    return (
        <div style={styles.page}>
            {/* TOP BRAND HEADER */}
            <header style={styles.headerArea}>
                <a
                    href="/"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                    }}
                    style={styles.brandLink}
                    aria-label="Auto Jobs Apply Homepage"
                >
                    <img src={logoSrc} alt="Auto Jobs Apply Logo" style={styles.logoImg} />
                    <span style={styles.brandText}>Auto Jobs Apply</span>
                </a>
            </header>

            {/* PAGE HEADER */}
            <div style={styles.titleSection}>
                <span style={styles.badge}>PAYMENT</span>
                <h1 style={styles.heading}>
                    Complete your <span style={styles.headingPurchase}>purchase</span>
                </h1>
                <p style={styles.subtitle}>
                    You're one step away from supercharging your job search.
                </p>
            </div>

            {/* MAIN CHECKOUT FORM & SUMMARY */}
            <div style={styles.mainContainer}>
                {/* LEFT CARD: PAYMENT METHOD & BILLING ADDRESS */}
                <div style={{ ...styles.card, ...styles.leftCard }}>
                    <form onSubmit={handleSubmit} noValidate>
                        {/* Section 1: Payment method */}
                        <h2 style={styles.sectionHeading}>Payment method</h2>
                        <p style={styles.sectionDesc}>
                            Enter your card details to complete the payment.
                        </p>

                        {/* Name on Card */}
                        <div style={styles.formGroup}>
                            <label htmlFor="nameOnCard" style={styles.label}>
                                Name on card
                            </label>
                            <input
                                id="nameOnCard"
                                name="nameOnCard"
                                type="text"
                                placeholder="Jane Doe"
                                value={formData.nameOnCard}
                                onChange={handleInputChange}
                                style={styles.input(!!errors.nameOnCard)}
                            />
                            {errors.nameOnCard && (
                                <span style={styles.errorText}>{errors.nameOnCard}</span>
                            )}
                        </div>

                        {/* Card Number */}
                        <div style={styles.formGroup}>
                            <label htmlFor="cardNumber" style={styles.label}>
                                Card number
                            </label>
                            <div style={styles.inputWrapper}>
                                <input
                                    id="cardNumber"
                                    name="cardNumber"
                                    type="text"
                                    placeholder="1234 5678 9012 3456"
                                    maxLength={19}
                                    value={formData.cardNumber}
                                    onChange={handleInputChange}
                                    style={{
                                        ...styles.input(!!errors.cardNumber),
                                        paddingRight: '42px',
                                    }}
                                />
                                <div
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: '#94A3B8',
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        style={{ width: '20px', height: '20px', stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}
                                    >
                                        <rect x="2" y="5" width="20" height="14" rx="2" />
                                        <line x1="2" y1="10" x2="22" y2="10" />
                                    </svg>
                                </div>
                            </div>
                            {errors.cardNumber && (
                                <span style={styles.errorText}>{errors.cardNumber}</span>
                            )}
                        </div>

                        {/* Expiry & CVV */}
                        <div style={styles.twoColGrid}>
                            <div style={styles.formGroup}>
                                <label htmlFor="expiry" style={styles.label}>
                                    Expiry (MM/YY)
                                </label>
                                <input
                                    id="expiry"
                                    name="expiry"
                                    type="text"
                                    placeholder="MM/YY"
                                    maxLength={5}
                                    value={formData.expiry}
                                    onChange={handleInputChange}
                                    style={styles.input(!!errors.expiry)}
                                />
                                {errors.expiry && (
                                    <span style={styles.errorText}>{errors.expiry}</span>
                                )}
                            </div>

                            <div style={styles.formGroup}>
                                <label htmlFor="cvv" style={styles.label}>
                                    CVV
                                </label>
                                <input
                                    id="cvv"
                                    name="cvv"
                                    type="password"
                                    placeholder="123"
                                    maxLength={4}
                                    value={formData.cvv}
                                    onChange={handleInputChange}
                                    style={styles.input(!!errors.cvv)}
                                />
                                {errors.cvv && (
                                    <span style={styles.errorText}>{errors.cvv}</span>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={styles.divider} />

                        {/* Section 2: Billing address */}
                        <h2 style={styles.sectionHeading}>Billing address</h2>
                        <p style={styles.sectionDesc}>
                            Enter your billing address as it appears on your card statement.
                        </p>

                        {/* Street Address */}
                        <div style={styles.formGroup}>
                            <label htmlFor="streetAddress" style={styles.label}>
                                Street address
                            </label>
                            <input
                                id="streetAddress"
                                name="streetAddress"
                                type="text"
                                placeholder="123 Main Street, Apt 4B"
                                value={formData.streetAddress}
                                onChange={handleInputChange}
                                style={styles.input(!!errors.streetAddress)}
                            />
                            {errors.streetAddress && (
                                <span style={styles.errorText}>{errors.streetAddress}</span>
                            )}
                        </div>

                        {/* City & ZIP */}
                        <div style={styles.twoColGrid}>
                            <div style={styles.formGroup}>
                                <label htmlFor="city" style={styles.label}>
                                    City
                                </label>
                                <input
                                    id="city"
                                    name="city"
                                    type="text"
                                    placeholder="San Francisco"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    style={styles.input(!!errors.city)}
                                />
                                {errors.city && (
                                    <span style={styles.errorText}>{errors.city}</span>
                                )}
                            </div>

                            <div style={styles.formGroup}>
                                <label htmlFor="zipCode" style={styles.label}>
                                    ZIP / Postal code
                                </label>
                                <input
                                    id="zipCode"
                                    name="zipCode"
                                    type="text"
                                    placeholder="94105"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    style={styles.input(!!errors.zipCode)}
                                />
                                {errors.zipCode && (
                                    <span style={styles.errorText}>{errors.zipCode}</span>
                                )}
                            </div>
                        </div>

                        {/* Country */}
                        <div style={styles.formGroup}>
                            <label htmlFor="country" style={styles.label}>
                                Country
                            </label>
                            <select
                                id="country"
                                name="country"
                                value={formData.country}
                                onChange={handleInputChange}
                                style={styles.select(!!errors.country)}
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
                                <span style={styles.errorText}>{errors.country}</span>
                            )}
                        </div>

                        {paymentSuccess && (
                            <div
                                style={{
                                    marginTop: '16px',
                                    padding: '12px 16px',
                                    backgroundColor: '#ECFDF5',
                                    border: '1px solid #A7F3D0',
                                    borderRadius: '10px',
                                    color: '#065F46',
                                    fontSize: '14.5px',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}
                            >
                                ✓ Order ready to process with secure gateway!
                            </div>
                        )}
                    </form>
                </div>

                {/* RIGHT CARD: ORDER SUMMARY */}
                <div style={{ ...styles.card, ...styles.rightCard }}>
                    {/* Back to plans button */}
                    <button
                        type="button"
                        onClick={() => navigate('/plan')}
                        style={styles.backButton}
                        aria-label="Back to pricing plans"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            style={{ width: '16px', height: '16px', stroke: 'currentColor', fill: 'none', strokeWidth: 2.5 }}
                        >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                        <span>Back to plans</span>
                    </button>

                    <h2 style={{ ...styles.sectionHeading, marginBottom: '18px' }}>
                        Order summary
                    </h2>

                    {/* Selected Plan Box */}
                    <div style={styles.planBox}>
                        <div style={styles.planHeaderRow}>
                            <h3 style={styles.planNameText}>{plan.name}</h3>
                            <span style={styles.planPriceText}>${plan.price.toFixed(2)}</span>
                        </div>
                        <span style={styles.planPeriodText}>
                            {plan.billing.replace('/', 'Per').trim()}
                        </span>
                        <p style={styles.planAppLimit}>{plan.applications}</p>
                    </div>

                    {/* Features List */}
                    <ul style={styles.summaryFeaturesList}>
                        {pricingFeatures.map((feature, idx) => (
                            <li key={idx} style={styles.summaryFeatureItem}>
                                <div style={styles.checkIcon}>
                                    <svg viewBox="0 0 24 24" style={styles.checkSvg}>
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <span style={styles.featureText}>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Divider */}
                    <div style={styles.divider} />

                    {/* Total Due Today */}
                    <div style={styles.totalRow}>
                        <span style={styles.totalLabel}>Total due today</span>
                        <span style={styles.totalAmount}>${plan.price.toFixed(2)}</span>
                    </div>

                    {/* Pay Button */}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={styles.payBtn(isHoveredPay)}
                        onMouseEnter={() => setIsHoveredPay(true)}
                        onMouseLeave={() => setIsHoveredPay(false)}
                    >
                        <svg viewBox="0 0 24 24" style={styles.lockSvg}>
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>
                            {isSubmitting ? 'Processing...' : `Pay $${plan.price.toFixed(2)}`}
                        </span>
                    </button>

                    {/* Security Notice */}
                    <div style={styles.securityText}>
                        <svg viewBox="0 0 24 24" style={styles.shieldSvg}>
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>Secured with 256-bit encryption</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Payment;
