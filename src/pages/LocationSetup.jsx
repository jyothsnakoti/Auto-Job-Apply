import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';
import { logoutUser, getStoredUser, getOnboardingState, setOnboardingState } from '../services/api';

const LocationSetup = () => {
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    // User email state
    const [userEmail, setUserEmail] = useState('nareshpulluri79@gmail.com');

    // Form state
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [stateVal, setStateVal] = useState('');
    const [country, setCountry] = useState('');
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [focusedField, setFocusedField] = useState(null); // 'address' | 'city' | 'state' | 'country'
    const [isHoveredContinue, setIsHoveredContinue] = useState(false);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        const user = getStoredUser();
        if (user.email) setUserEmail(user.email);

        const savedState = getOnboardingState();
        if (savedState.addressLine1 || savedState.address) setAddress(savedState.addressLine1 || savedState.address);
        if (savedState.city) setCity(savedState.city);
        if (savedState.state || savedState.stateVal) setStateVal(savedState.state || savedState.stateVal);
        if (savedState.country) setCountry(savedState.country);
    }, []);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close country dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsCountryDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1100;
    const isDesktop = windowWidth >= 1100;

    const countries = [
        'United States',
        'Canada',
        'United Kingdom',
        'Australia',
        'Germany',
        'India',
        'France',
        'Netherlands',
        'Singapore',
        'Ireland',
        'Switzerland',
        'United Arab Emirates',
        'Sweden',
        'Japan',
        'Spain',
        'Italy',
        'Brazil',
        'New Zealand',
    ];

    const benefits = [
        'Match jobs to your preferred locations',
        'Prioritize remote, hybrid or on-site roles',
        'Pre-fill supported application fields',
    ];

    const handleContinue = () => {
        setValidationError('');
        if (!address.trim() || !city.trim() || !stateVal.trim() || !country.trim()) {
            setValidationError('Please fill in all required location fields.');
            return;
        }

        setOnboardingState({
            addressLine1: address.trim(),
            address: address.trim(),
            city: city.trim(),
            state: stateVal.trim(),
            stateVal: stateVal.trim(),
            country: country.trim(),
        });

        navigate('/contact-setup', {
            state: {
                address,
                city,
                state: stateVal,
                country,
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
            height: '76px',
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
            fontSize: 'clamp(20px, 1.5vw, 24px)',
            color: '#00509F',
            letterSpacing: '-0.02em',
            margin: 0,
        },
        userArea: {
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '14px' : '24px',
        },
        userEmail: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: isMobile ? '13px' : '14.5px',
            color: '#64748B',
            fontWeight: '500',
        },
        logoutBtn: {
            background: 'none',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14.5px',
            fontWeight: '600',
            color: '#0F172A',
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '8px',
            transition: 'opacity 0.2s ease',
        },
        logoutSvg: {
            width: '17px',
            height: '17px',
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
            paddingTop: isMobile ? '24px' : 'clamp(32px, 3vw, 44px)',
            paddingBottom: isMobile ? '40px' : 'clamp(48px, 4vw, 70px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            boxSizing: 'border-box',
        },
        mainCard: {
            width: '100%',
            maxWidth: '1400px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: isMobile ? '20px' : '28px',
            boxShadow: '0px 10px 30px rgba(79, 70, 229, 0.06)',
            padding: isMobile ? '24px 20px' : isTablet ? '36px 32px' : 'clamp(36px, 3vw, 46px)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
        },
        progressSection: {
            width: '100%',
            marginBottom: 'clamp(24px, 2.2vw, 32px)',
        },
        progressHeaderRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
        },
        progressLabel: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15px',
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
            fontSize: '14.5px',
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
            width: '33.33%',
            height: '100%',
            background: 'linear-gradient(90deg, #4F46E5, #9333EA)',
            borderRadius: '9999px',
            transition: 'width 0.4s ease',
        },
        contentGrid: {
            display: 'grid',
            gridTemplateColumns: isDesktop ? '0.75fr 1.25fr' : '1fr',
            gap: isDesktop ? 'clamp(36px, 3.5vw, 54px)' : '32px',
            alignItems: 'start',
            width: '100%',
            marginTop: 'clamp(14px, 1.2vw, 20px)',
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
            padding: '6px 14px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '11.5px',
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
            lineHeight: '1.18',
            letterSpacing: '-0.8px',
            color: '#0F172A',
            margin: '0 0 clamp(14px, 1.2vw, 18px) 0',
        },
        leftDesc: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15px',
            lineHeight: '25px',
            color: '#475569',
            margin: '0 0 clamp(24px, 2.2vw, 32px) 0',
            maxWidth: '460px',
        },
        benefitsList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(14px, 1.3vw, 18px)',
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
            width: '20px',
            height: '20px',
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
            width: '11px',
            height: '11px',
            stroke: '#2563EB',
            strokeWidth: '2.5',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        benefitText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14.5px',
            lineHeight: '23px',
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
            fontSize: 'clamp(22px, 1.8vw, 28px)',
            lineHeight: '1.2',
            color: '#0F172A',
            margin: '0 0 10px 0',
        },
        rightHeadingBlue: {
            color: '#2563EB',
        },
        rightDesc: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14px',
            lineHeight: '22px',
            color: '#64748B',
            margin: '0 0 clamp(22px, 1.8vw, 28px) 0',
        },
        formFieldsGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            width: '100%',
        },
        fieldLabel: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: '#334155',
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
        inputField: (isFocused) => ({
            width: '100%',
            height: '48px',
            paddingLeft: '44px',
            paddingRight: '16px',
            borderRadius: '12px',
            border: isFocused ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            fontSize: '14.5px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: '#0F172A',
            outline: 'none',
            boxSizing: 'border-box',
            boxShadow: isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }),
        cityStateRow: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '16px',
            width: '100%',
        },
        dropdownToggle: (isOpen) => ({
            width: '100%',
            height: '48px',
            paddingLeft: '14px',
            paddingRight: '16px',
            borderRadius: '12px',
            border: isOpen ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            fontSize: '14.5px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: country ? '#0F172A' : '#94A3B8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            textAlign: 'left',
            boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }),
        chevronIcon: {
            width: '18px',
            height: '18px',
            stroke: '#94A3B8',
            strokeWidth: '2',
            fill: 'none',
            transition: 'transform 0.2s ease, stroke 0.2s ease',
        },
        dropdownMenu: {
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            maxHeight: '220px',
            overflowY: 'auto',
            zIndex: 50,
            padding: '6px 0',
        },
        dropdownItem: (isSelected) => ({
            padding: '10px 16px',
            fontSize: '14px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: isSelected ? '#2563EB' : '#1E293B',
            backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.15s ease',
        }),
        continueBtn: (isHovered) => ({
            width: isMobile ? '100%' : '145px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(90deg, #3B82F6, #4F46E5)',
            color: '#FFFFFF',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15px',
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
            marginTop: '28px',
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

                {/* Right: Email */}
                <div style={styles.userArea}>
                    <span style={styles.userEmail}>{userEmail || 'nareshpulluri79@gmail.com'}</span>
                </div>
            </header>

            {/* MAIN CONTENT AREA */}
            <main style={styles.mainWrapper}>
                <div style={styles.mainCard}>
                    {/* PROGRESS HEADER */}
                    <div style={styles.progressSection}>
                        <div style={styles.progressHeaderRow}>
                            <span style={styles.progressLabel}>Step 2 of 6</span>
                            <button
                                type="button"
                                onClick={() => navigate('/resume-setup')}
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
                                <span>PROFILE SETUP</span>
                            </div>

                            <h1 style={styles.leftHeading}>
                                Your location helps
                                <br />
                                us find the right
                                <br />
                                jobs.
                            </h1>

                            <p style={styles.leftDesc}>
                                We use your location and work preferences to match you with relevant opportunities and
                                automatically fill application forms accurately.
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
                            <h2 style={styles.rightHeading}>
                                Where are you looking <span style={styles.rightHeadingBlue}>to work?</span>
                            </h2>

                            <p style={styles.rightDesc}>
                                Tell us where you're targeting jobs so we can match opportunities to your location and
                                work preferences.
                            </p>

                            <div style={styles.formFieldsGroup}>
                                {/* ADDRESS */}
                                <div>
                                    <label style={styles.fieldLabel}>ADDRESS</label>
                                    <div style={styles.inputWrapper}>
                                        <svg viewBox="0 0 24 24" style={styles.inputIcon(focusedField === 'address')}>
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={address}
                                            onFocus={() => setFocusedField('address')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Start typing your address....."
                                            style={styles.inputField(focusedField === 'address')}
                                        />
                                    </div>
                                </div>

                                {/* CITY & STATE */}
                                <div style={styles.cityStateRow}>
                                    <div>
                                        <label style={styles.fieldLabel}>CITY</label>
                                        <div style={styles.inputWrapper}>
                                            <svg viewBox="0 0 24 24" style={styles.inputIcon(focusedField === 'city')}>
                                                <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                                                <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
                                                <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
                                                <path d="M10 6h4" />
                                                <path d="M10 10h4" />
                                                <path d="M10 14h4" />
                                                <path d="M10 18h4" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={city}
                                                onFocus={() => setFocusedField('city')}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setCity(e.target.value)}
                                                placeholder="e.g. San Francisco"
                                                style={styles.inputField(focusedField === 'city')}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={styles.fieldLabel}>STATE</label>
                                        <div style={styles.inputWrapper}>
                                            <svg viewBox="0 0 24 24" style={styles.inputIcon(focusedField === 'state')}>
                                                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                                                <line x1="9" y1="3" x2="9" y2="18" />
                                                <line x1="15" y1="6" x2="15" y2="21" />
                                            </svg>
                                            <input
                                                type="text"
                                                value={stateVal}
                                                onFocus={() => setFocusedField('state')}
                                                onBlur={() => setFocusedField(null)}
                                                onChange={(e) => setStateVal(e.target.value)}
                                                placeholder="e.g. California"
                                                style={styles.inputField(focusedField === 'state')}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* COUNTRY */}
                                <div ref={dropdownRef} style={{ position: 'relative' }}>
                                    <label style={styles.fieldLabel}>COUNTRY</label>
                                    <button
                                        type="button"
                                        style={styles.dropdownToggle(isCountryDropdownOpen)}
                                        onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                        aria-haspopup="listbox"
                                        aria-expanded={isCountryDropdownOpen}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <svg
                                                viewBox="0 0 24 24"
                                                style={{
                                                    width: '18px',
                                                    height: '18px',
                                                    stroke: isCountryDropdownOpen ? '#2563EB' : '#94A3B8',
                                                    strokeWidth: '2',
                                                    fill: 'none',
                                                    flexShrink: 0,
                                                    transition: 'stroke 0.2s ease',
                                                }}
                                            >
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="2" y1="12" x2="22" y2="12" />
                                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                            </svg>
                                            <span>{country || 'Select a country'}</span>
                                        </div>
                                        <svg
                                            viewBox="0 0 24 24"
                                            style={{
                                                ...styles.chevronIcon,
                                                stroke: isCountryDropdownOpen ? '#2563EB' : '#94A3B8',
                                                transform: isCountryDropdownOpen ? 'rotate(180deg)' : 'none',
                                            }}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>

                                    {isCountryDropdownOpen && (
                                        <ul style={styles.dropdownMenu} role="listbox">
                                            {countries.map((c) => (
                                                <li
                                                    key={c}
                                                    role="option"
                                                    aria-selected={country === c}
                                                    style={styles.dropdownItem(country === c)}
                                                    onClick={() => {
                                                        setCountry(c);
                                                        setIsCountryDropdownOpen(false);
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (country !== c) e.currentTarget.style.backgroundColor = '#F8FAFC';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (country !== c) e.currentTarget.style.backgroundColor = 'transparent';
                                                    }}
                                                >
                                                    <span>{c}</span>
                                                    {country === c && (
                                                        <svg
                                                            viewBox="0 0 24 24"
                                                            style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                stroke: '#2563EB',
                                                                strokeWidth: '2.5',
                                                                fill: 'none',
                                                            }}
                                                        >
                                                            <polyline points="20 6 9 17 4 12" />
                                                        </svg>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
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

export default LocationSetup;
