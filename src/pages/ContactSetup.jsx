import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';

const ContactSetup = () => {
    const navigate = useNavigate();

    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    // Form state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [focusedField, setFocusedField] = useState(null); // 'phone' | 'linkedin'
    const [isHoveredContinue, setIsHoveredContinue] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1100;
    const isDesktop = windowWidth >= 1100;

    const benefits = [
        'Auto-fills application contact information',
        'Uses the same details across job sites',
        'Helps you receive important updates',
    ];

    const handleContinue = () => {
        navigate('/work-eligibility', {
            state: {
                phoneNumber,
                linkedinUrl,
            },
        });
    };

    const styles = {
        page: {
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#F5F3FF',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box',
        },
        navbar: {
            width: '100%',
            height: '80px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingLeft: isMobile ? '20px' : isTablet ? '36px' : 'clamp(40px, 4vw, 80px)',
            paddingRight: isMobile ? '20px' : isTablet ? '36px' : 'clamp(40px, 4vw, 80px)',
            boxSizing: 'border-box',
        },
        brandWrapper: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            cursor: 'pointer',
        },
        logoImg: {
            width: '38px',
            height: '38px',
            objectFit: 'contain',
        },
        brandText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(22px, 1.6vw, 26px)',
            color: '#00509F',
            letterSpacing: '-0.02em',
            margin: 0,
        },
        userArea: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '14px' : '28px',
        },
        userEmail: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: isMobile ? '14px' : '15.5px',
            color: '#64748B',
            fontWeight: '500',
        },
        logoutBtn: {
            background: 'none',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            color: '#0F172A',
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '8px',
            transition: 'opacity 0.2s ease',
        },
        logoutSvg: {
            width: '18px',
            height: '18px',
            stroke: '#0F172A',
            strokeWidth: '2.2',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        mainWrapper: {
            width: '100%',
            flexGrow: 1,
            paddingLeft: isMobile ? '16px' : isTablet ? '28px' : 'clamp(32px, 3.5vw, 64px)',
            paddingRight: isMobile ? '16px' : isTablet ? '28px' : 'clamp(32px, 3.5vw, 64px)',
            paddingTop: isMobile ? '24px' : 'clamp(32px, 3vw, 48px)',
            paddingBottom: isMobile ? '40px' : 'clamp(48px, 4vw, 70px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxSizing: 'border-box',
        },
        mainCard: {
            width: '100%',
            maxWidth: '1520px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: isMobile ? '20px' : '28px',
            boxShadow: '0px 10px 30px rgba(79, 70, 229, 0.08)',
            padding: isMobile ? '24px 20px' : isTablet ? '36px 32px' : 'clamp(36px, 3vw, 48px)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
        },
        progressSection: {
            width: '100%',
            marginBottom: 'clamp(28px, 2.5vw, 36px)',
        },
        progressHeaderRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
        },
        progressLabel: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            fontWeight: '500',
            color: '#64748B',
        },
        backBtn: {
            background: 'none',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15px',
            fontWeight: '600',
            color: '#0F172A',
            cursor: 'pointer',
            padding: '4px 6px',
            transition: 'color 0.2s ease, transform 0.15s ease',
        },
        progressBarTrack: {
            width: '100%',
            height: '7px',
            backgroundColor: '#EEF2F7',
            borderRadius: '9999px',
            overflow: 'hidden',
        },
        progressBarFill: {
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, #4F46E5, #A855F7)',
            borderRadius: '9999px',
            transition: 'width 0.4s ease',
        },
        contentGrid: {
            display: 'grid',
            gridTemplateColumns: isDesktop ? '0.75fr 1.25fr' : '1fr',
            gap: isDesktop ? 'clamp(40px, 3.5vw, 56px)' : '36px',
            alignItems: 'stretch',
            width: '100%',
            marginTop: 'clamp(16px, 1.5vw, 24px)',
        },
        // Left Column
        leftCol: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
        },
        leftBadge: {
            backgroundColor: '#EFF6FF',
            border: '1px solid #DBEAFE',
            borderRadius: '9999px',
            padding: '7px 14px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.6px',
            color: '#2563EB',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: 'clamp(16px, 1.4vw, 22px)',
        },
        blueDot: {
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#2563EB',
        },
        leftHeading: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '800',
            fontSize: 'clamp(28px, 2.3vw, 36px)',
            lineHeight: '1.15',
            letterSpacing: '-0.8px',
            color: '#0F172A',
            margin: '0 0 clamp(14px, 1.2vw, 18px) 0',
        },
        leftDesc: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            lineHeight: '26px',
            color: '#475569',
            margin: '0 0 clamp(28px, 2.5vw, 36px) 0',
            maxWidth: '500px',
        },
        benefitsList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(16px, 1.4vw, 20px)',
            padding: 0,
            margin: 0,
            listStyle: 'none',
            width: '100%',
        },
        benefitItem: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
        },
        benefitIconWrapper: {
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: '2px',
        },
        benefitCheckSvg: {
            width: '12px',
            height: '12px',
            stroke: '#2563EB',
            strokeWidth: '2.5',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        benefitText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15.5px',
            lineHeight: '24px',
            color: '#334155',
            fontWeight: '500',
        },
        // Right Form Card
        rightCard: {
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: isMobile ? '24px 18px' : 'clamp(28px, 2.4vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
        },
        rightHeading: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '800',
            fontSize: 'clamp(24px, 2vw, 30px)',
            lineHeight: '1.2',
            color: '#0F172A',
            margin: '0 0 10px 0',
        },
        rightDesc: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15px',
            lineHeight: '24px',
            color: '#64748B',
            margin: '0 0 clamp(24px, 2vw, 32px) 0',
        },
        formFieldsGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            width: '100%',
        },
        fieldLabel: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14.5px',
            fontWeight: '600',
            color: '#1E293B',
            marginBottom: '8px',
            display: 'block',
        },
        inputWrapper: {
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
        },
        inputIcon: (isFocused) => ({
            position: 'absolute',
            left: '14px',
            width: '18px',
            height: '18px',
            stroke: isFocused ? '#2563EB' : '#94A3B8',
            strokeWidth: '2',
            fill: 'none',
            pointerEvents: 'none',
            transition: 'stroke 0.2s ease',
        }),
        linkedinBadge: {
            position: 'absolute',
            left: '14px',
            width: '18px',
            height: '18px',
            backgroundColor: '#0A66C2',
            borderRadius: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: '700',
            fontFamily: 'sans-serif',
            pointerEvents: 'none',
            userSelect: 'none',
        },
        inputField: (isFocused) => ({
            width: '100%',
            height: '48px',
            paddingLeft: '44px',
            paddingRight: '16px',
            borderRadius: '12px',
            border: isFocused ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            fontSize: '15px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: '#0F172A',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }),
        fieldHelper: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12.5px',
            color: '#94A3B8',
            marginTop: '6px',
            display: 'block',
        },
        continueBtn: (isHovered) => ({
            width: isMobile ? '100%' : '160px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, #3B82F6, #4F46E5)',
            color: '#FFFFFF',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isHovered
                ? '0px 6px 16px rgba(79, 70, 229, 0.4)'
                : '0px 4px 10px rgba(79, 70, 229, 0.25)',
            transform: isHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.25s ease',
            marginTop: '36px',
            alignSelf: isMobile ? 'stretch' : 'flex-end',
        }),
        arrowSvg: {
            width: '18px',
            height: '18px',
            stroke: '#FFFFFF',
            strokeWidth: '2.4',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
    };

    return (
        <div style={styles.page}>
            {/* TOP NAVBAR */}
            <header style={styles.navbar}>
                {/* Brand */}
                <a
                    href="/"
                    onClick={(e) => {
                        e.preventDefault();
                        navigate('/');
                    }}
                    style={styles.brandWrapper}
                    aria-label="Auto Jobs Apply Homepage"
                >
                    <img src={logoSrc} alt="Auto Jobs Apply Logo" style={styles.logoImg} />
                    <span style={styles.brandText}>Auto Jobs Apply</span>
                </a>

                {/* Right: Email & Logout */}
                <div style={styles.userArea}>
                    <span style={styles.userEmail}>nareshpulluri79@gmail.com</span>
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        style={styles.logoutBtn}
                        aria-label="Log out"
                    >
                        <svg viewBox="0 0 24 24" style={styles.logoutSvg}>
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Log out</span>
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main style={styles.mainWrapper}>
                <div style={styles.mainCard}>
                    {/* PROGRESS HEADER */}
                    <div style={styles.progressSection}>
                        <div style={styles.progressHeaderRow}>
                            <span style={styles.progressLabel}>Step 3 of 6</span>
                            <button
                                type="button"
                                onClick={() => navigate('/location-setup')}
                                style={styles.backBtn}
                                aria-label="Go back to previous step"
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        stroke: 'currentColor',
                                        strokeWidth: '2.4',
                                        fill: 'none',
                                    }}
                                >
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                <span>Back</span>
                            </button>
                        </div>
                        <div style={styles.progressBarTrack}>
                            <div style={styles.progressBarFill} />
                        </div>
                    </div>

                    {/* TWO COLUMN GRID */}
                    <div style={styles.contentGrid}>
                        {/* LEFT COLUMN */}
                        <div style={styles.leftCol}>
                            <div style={styles.leftBadge}>
                                <span style={styles.blueDot} />
                                <span>CONTACT SETUP</span>
                            </div>

                            <h1 style={styles.leftHeading}>
                                Stay connected, never
                                <br />
                                miss an opportunity.
                            </h1>

                            <p style={styles.leftDesc}>
                                We'll use this information to fill application forms and ensure recruiters can reach
                                you.
                            </p>

                            <ul style={styles.benefitsList}>
                                {benefits.map((benefit, idx) => (
                                    <li key={idx} style={styles.benefitItem}>
                                        <div style={styles.benefitIconWrapper}>
                                            <svg viewBox="0 0 24 24" style={styles.benefitCheckSvg}>
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span style={styles.benefitText}>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* RIGHT FORM CARD */}
                        <div style={styles.rightCard}>
                            <h2 style={styles.rightHeading}>How should we reach out?</h2>

                            <p style={styles.rightDesc}>
                                Your phone number and LinkedIn profile help us auto-fill applications and make sure
                                recruiters can reach you.
                            </p>

                            <div style={styles.formFieldsGroup}>
                                {/* PHONE NUMBER */}
                                <div>
                                    <label style={styles.fieldLabel}>Phone number</label>
                                    <div style={styles.inputWrapper}>
                                        <svg viewBox="0 0 24 24" style={styles.inputIcon(focusedField === 'phone')}>
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onFocus={() => setFocusedField('phone')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="Enter phone number with country code"
                                            style={styles.inputField(focusedField === 'phone')}
                                        />
                                    </div>
                                    <span style={styles.fieldHelper}>
                                        Example: +1 for US/Canada, +91 for India, etc.
                                    </span>
                                </div>

                                {/* LINKEDIN PROFILE */}
                                <div>
                                    <label style={styles.fieldLabel}>LinkedIn profile</label>
                                    <div style={styles.inputWrapper}>
                                        <div style={styles.linkedinBadge}>in</div>
                                        <input
                                            type="url"
                                            value={linkedinUrl}
                                            onFocus={() => setFocusedField('linkedin')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={(e) => setLinkedinUrl(e.target.value)}
                                            placeholder="https://linkedin.com/in/yourhandle"
                                            style={styles.inputField(focusedField === 'linkedin')}
                                        />
                                    </div>
                                    <span style={styles.fieldHelper}>
                                        We'll use this to pre-fill applications on most job sites.
                                    </span>
                                </div>
                            </div>

                            {/* CONTINUE BUTTON */}
                            <button
                                type="button"
                                onClick={handleContinue}
                                style={styles.continueBtn(isHoveredContinue)}
                                onMouseEnter={() => setIsHoveredContinue(true)}
                                onMouseLeave={() => setIsHoveredContinue(false)}
                            >
                                <span>Continue</span>
                                <svg viewBox="0 0 24 24" style={styles.arrowSvg}>
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ContactSetup;
