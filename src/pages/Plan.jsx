import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';

const Plan = () => {
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    const [hoveredCard, setHoveredCard] = useState(null);
    const [hoveredButton, setHoveredButton] = useState(null);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1150;
    const isDesktop = windowWidth >= 1150;

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
            paddingTop: 'clamp(36px, 3.5vw, 60px)',
            paddingBottom: 'clamp(60px, 6vw, 100px)',
            paddingLeft: isMobile ? '20px' : isTablet ? '32px' : 'clamp(32px, 4vw, 70px)',
            paddingRight: isMobile ? '20px' : isTablet ? '32px' : 'clamp(32px, 4vw, 70px)',
        },
        headerArea: {
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 'clamp(28px, 2.5vw, 42px)',
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
        mainSection: {
            width: '100%',
            maxWidth: '1540px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
        },
        badge: {
            backgroundColor: '#EEF2FF',
            border: '1px solid #DDE5FF',
            borderRadius: '9999px',
            padding: '6px 16px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(12px, 0.78vw, 14px)',
            lineHeight: '16px',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: '#4F46E5',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(14px, 1.2vw, 20px)',
        },
        heading: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 'clamp(34px, 2.9vw, 50px)',
            fontWeight: '800',
            lineHeight: '1.12',
            letterSpacing: '-0.025em',
            color: '#0F172A',
            margin: '0 0 clamp(10px, 0.9vw, 14px) 0',
            textAlign: 'center',
        },
        description: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 'clamp(16px, 1vw, 18px)',
            lineHeight: 'clamp(24px, 1.6vw, 28px)',
            fontWeight: '400',
            color: '#64748B',
            margin: '0 0 clamp(40px, 3.5vw, 60px) 0',
            maxWidth: '780px',
            textAlign: 'center',
        },
        cardsGrid: {
            display: 'grid',
            gridTemplateColumns: isMobile
                ? '1fr'
                : isTablet
                ? 'repeat(2, 1fr)'
                : 'repeat(3, 1fr)',
            gap: 'clamp(18px, 1.5vw, 24px)',
            width: '100%',
            maxWidth: '1520px',
            alignItems: 'stretch',
        },
        card: (isPro, isHovered) => ({
            background: isPro
                ? isHovered
                    ? 'linear-gradient(180deg, #FFFFFF 0%, #EDE9FE 100%)'
                    : 'linear-gradient(180deg, #FFFFFF 0%, #FAF5FF 100%)'
                : isHovered
                ? 'linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 100%)'
                : '#FFFFFF',
            borderRadius: '24px',
            padding: 'clamp(32px, 2.4vw, 42px) clamp(28px, 2.2vw, 38px)',
            border: isPro
                ? isHovered
                    ? '2px solid #6366F1'
                    : '2px solid #818CF8'
                : isHovered
                ? '1px solid #A5B4FC'
                : '1px solid #E2E8F0',
            boxShadow: isPro
                ? isHovered
                    ? '0px 25px 50px -10px rgba(79, 70, 229, 0.3), 0px 0px 0px 1px rgba(99, 102, 241, 0.2)'
                    : '0px 8px 24px rgba(79, 70, 229, 0.15)'
                : isHovered
                ? '0px 22px 45px -10px rgba(79, 70, 229, 0.18), 0px 0px 0px 1px rgba(99, 102, 241, 0.12)'
                : '0px 8px 24px rgba(79, 70, 229, 0.08)',
            transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            position: 'relative',
            cursor: 'default',
        }),
        popularBadge: {
            position: 'absolute',
            top: '-18px',
            right: '28px',
            background: 'linear-gradient(90deg, #4F46E5 0%, #6366F1 100%)',
            color: '#FFFFFF',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '700',
            fontSize: '12.5px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            padding: '8px 18px',
            borderRadius: '9999px',
            boxShadow: '0px 4px 14px rgba(79, 70, 229, 0.45)',
            zIndex: 2,
        },
        planTitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(21px, 1.4vw, 24px)',
            lineHeight: '1.2',
            color: '#0F172A',
            margin: '0 0 clamp(10px, 0.8vw, 14px) 0',
        },
        priceRow: {
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            margin: '0 0 clamp(8px, 0.6vw, 12px) 0',
        },
        priceAmount: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 'clamp(42px, 2.9vw, 50px)',
            fontWeight: '800',
            lineHeight: '1',
            letterSpacing: '-1px',
            color: '#0F172A',
        },
        pricePeriod: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 'clamp(15px, 0.95vw, 18px)',
            fontWeight: '400',
            color: '#64748B',
        },
        planLimit: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 'clamp(14px, 0.9vw, 16px)',
            fontWeight: '600',
            color: '#4F46E5',
            margin: 0,
        },
        divider: {
            borderTop: '1px solid #E2E8F0',
            marginTop: 'clamp(24px, 1.8vw, 30px)',
            marginBottom: 'clamp(20px, 1.5vw, 26px)',
            width: '100%',
        },
        featuresList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(15px, 1.1vw, 19px)',
            flexGrow: 1,
            marginBottom: 'clamp(28px, 2.2vw, 36px)',
            width: '100%',
        },
        featureItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        checkIcon: {
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        checkSvg: {
            width: '11px',
            height: '11px',
            stroke: '#FFFFFF',
            strokeWidth: '3',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        featureText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: 'clamp(15px, 0.95vw, 16px)',
            fontWeight: '500',
            color: '#334155',
            lineHeight: '22px',
        },
        ctaButton: (isHovered) => ({
            width: '100%',
            height: '52px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '700',
            color: '#FFFFFF',
            background: 'linear-gradient(90deg, #2563EB 0%, #4F46E5 50%, #1D4ED8 100%)',
            backgroundSize: '200% 100%',
            backgroundPosition: isHovered ? '100% 0' : '0 0',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isHovered
                ? '0 10px 28px -4px rgba(37, 99, 235, 0.5), 0 4px 14px -2px rgba(79, 70, 229, 0.4)'
                : '0px 2px 4px -2px rgba(37, 99, 235, 0.3), 0px 4px 6px -1px rgba(79, 70, 229, 0.3)',
            transform: isHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            textDecoration: 'none',
            marginTop: 'auto',
        }),
        arrowIcon: (isHovered) => ({
            width: '18px',
            height: '18px',
            strokeWidth: '2.4',
            stroke: 'currentColor',
            fill: 'none',
            display: 'inline-block',
            flexShrink: 0,
            transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
            transition: 'transform 0.25s ease',
        }),
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

            {/* MAIN PRICING SECTION */}
            <main style={styles.mainSection}>
                {/* Badge */}
                <span style={styles.badge}>PRICING</span>

                {/* Heading */}
                <h1 style={styles.heading}>Simple and transparent pricing.</h1>

                {/* Description */}
                <p style={styles.description}>
                    Choose a plan that fits your job search goals. No payment per individual application.
                </p>

                {/* THREE PLAN CARDS */}
                <div style={styles.cardsGrid}>
                    {/* 1. TRIAL PACK */}
                    <div
                        style={styles.card(false, hoveredCard === 'trial')}
                        onMouseEnter={() => setHoveredCard('trial')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <h2 style={styles.planTitle}>Trial Pack</h2>

                        <div style={styles.priceRow}>
                            <span style={styles.priceAmount}>Free Plan</span>
                        </div>

                        <p style={styles.planLimit}>Upto 10 applications</p>

                        <div style={styles.divider} />

                        <div style={styles.featuresList}>
                            {pricingFeatures.map((feature, idx) => (
                                <div key={idx} style={styles.featureItem}>
                                    <div style={styles.checkIcon}>
                                        <svg viewBox="0 0 24 24" style={styles.checkSvg}>
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <span style={styles.featureText}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                navigate('/resume-setup');
                            }}
                            style={styles.ctaButton(hoveredButton === 'trial')}
                            onMouseEnter={() => setHoveredButton('trial')}
                            onMouseLeave={() => setHoveredButton(null)}
                        >
                            <span>Get Started</span>
                            <svg
                                style={styles.arrowIcon(hoveredButton === 'trial')}
                                viewBox="0 0 24 24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* 2. BASIC PLAN */}
                    <div
                        style={styles.card(false, hoveredCard === 'basic')}
                        onMouseEnter={() => setHoveredCard('basic')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        <h2 style={styles.planTitle}>Basic Plan</h2>

                        <div style={styles.priceRow}>
                            <span style={styles.priceAmount}>$4.99</span>
                            <span style={styles.pricePeriod}>/ month</span>
                        </div>

                        <p style={styles.planLimit}>Up to 250 applications</p>

                        <div style={styles.divider} />

                        <div style={styles.featuresList}>
                            {pricingFeatures.map((feature, idx) => (
                                <div key={idx} style={styles.featureItem}>
                                    <div style={styles.checkIcon}>
                                        <svg viewBox="0 0 24 24" style={styles.checkSvg}>
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <span style={styles.featureText}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                navigate('/payment', {
                                    state: {
                                        name: 'Basic Plan',
                                        price: 4.99,
                                        billing: '/ month',
                                        applications: 'Up to 250 applications',
                                    },
                                });
                            }}
                            style={styles.ctaButton(hoveredButton === 'basic')}
                            onMouseEnter={() => setHoveredButton('basic')}
                            onMouseLeave={() => setHoveredButton(null)}
                        >
                            <span>Get Started</span>
                            <svg
                                style={styles.arrowIcon(hoveredButton === 'basic')}
                                viewBox="0 0 24 24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* 3. PRO PLAN */}
                    <div
                        style={styles.card(true, hoveredCard === 'pro')}
                        onMouseEnter={() => setHoveredCard('pro')}
                        onMouseLeave={() => setHoveredCard(null)}
                    >
                        {/* MOST POPULAR BADGE */}
                        <span style={styles.popularBadge}>MOST POPULAR</span>

                        <h2 style={styles.planTitle}>Pro Plan</h2>

                        <div style={styles.priceRow}>
                            <span style={styles.priceAmount}>$12.99</span>
                            <span style={styles.pricePeriod}>/ quarter</span>
                        </div>

                        <p style={styles.planLimit}>Up to 1000 applications</p>

                        <div style={styles.divider} />

                        <div style={styles.featuresList}>
                            {pricingFeatures.map((feature, idx) => (
                                <div key={idx} style={styles.featureItem}>
                                    <div style={styles.checkIcon}>
                                        <svg viewBox="0 0 24 24" style={styles.checkSvg}>
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <span style={styles.featureText}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                navigate('/payment', {
                                    state: {
                                        name: 'Pro Plan',
                                        price: 12.99,
                                        billing: '/ quarter',
                                        applications: 'Up to 1000 applications',
                                    },
                                });
                            }}
                            style={styles.ctaButton(hoveredButton === 'pro')}
                            onMouseEnter={() => setHoveredButton('pro')}
                            onMouseLeave={() => setHoveredButton(null)}
                        >
                            <span>Get Started</span>
                            <svg
                                style={styles.arrowIcon(hoveredButton === 'pro')}
                                viewBox="0 0 24 24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Plan;
