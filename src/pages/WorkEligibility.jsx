import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';

const WorkEligibility = () => {
    const navigate = useNavigate();
    const citizenshipDropdownRef = useRef(null);
    const workCountriesDropdownRef = useRef(null);

    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    // Dropdown states
    const [isCitizenshipOpen, setIsCitizenshipOpen] = useState(false);
    const [isWorkCountriesOpen, setIsWorkCountriesOpen] = useState(false);
    const [citizenshipSearch, setCitizenshipSearch] = useState('');
    const [workCountrySearch, setWorkCountrySearch] = useState('');

    // Selected data
    const [citizenshipCountries, setCitizenshipCountries] = useState([]);
    const [addedCountries, setAddedCountries] = useState([]);
    const [focusedBasis, setFocusedBasis] = useState(null);

    const [isHoveredContinue, setIsHoveredContinue] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (citizenshipDropdownRef.current && !citizenshipDropdownRef.current.contains(e.target)) {
                setIsCitizenshipOpen(false);
            }
            if (workCountriesDropdownRef.current && !workCountriesDropdownRef.current.contains(e.target)) {
                setIsWorkCountriesOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1100;
    const isDesktop = windowWidth >= 1100;

    const allCountries = [
        'India',
        'United States',
        'United Kingdom',
        'Canada',
        'Germany',
        'Australia',
        'Singapore',
        'France',
        'Netherlands',
        'Ireland',
        'Switzerland',
        'United Arab Emirates',
        'Sweden',
        'Japan',
    ];

    const authorizationOptions = [
        'Citizen',
        'Permanent Resident',
        'Work Visa / Permit',
        'Student Visa (OPT / CPT)',
        'Other Valid Work Authorization',
    ];

    const benefits = [
        'Match jobs based on your location preferences',
        'Filter out restricted opportunities',
        'Save time with pre-filled application answers',
    ];

    const filteredCitizenshipCountries = allCountries.filter((c) =>
        c.toLowerCase().includes(citizenshipSearch.toLowerCase())
    );

    const filteredWorkCountries = allCountries.filter((c) =>
        c.toLowerCase().includes(workCountrySearch.toLowerCase())
    );

    const handleAddCountry = (countryName) => {
        if (!addedCountries.some((c) => c.country === countryName)) {
            setAddedCountries((prev) => [
                ...prev,
                {
                    country: countryName,
                    isAuthorized: null,
                    requiresSponsorship: null,
                    authorizationBasis: '',
                },
            ]);
        }
        setIsWorkCountriesOpen(false);
        setWorkCountrySearch('');
    };

    const handleRemoveCountry = (countryName) => {
        setAddedCountries((prev) => prev.filter((c) => c.country !== countryName));
    };

    const updateCountryField = (countryName, field, value) => {
        setAddedCountries((prev) =>
            prev.map((item) =>
                item.country === countryName ? { ...item, [field]: value } : item
            )
        );
    };

    const handleContinue = () => {
        navigate('/final-details', {
            state: {
                citizenshipCountries,
                addedCountries,
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
            width: '66.67%',
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
        fieldLabel: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14px',
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
            cursor: 'pointer',
        },
        inputIcon: (isOpen) => ({
            position: 'absolute',
            left: '14px',
            width: '18px',
            height: '18px',
            stroke: isOpen ? '#2563EB' : '#94A3B8',
            strokeWidth: '2',
            fill: 'none',
            pointerEvents: 'none',
            flexShrink: 0,
            transition: 'stroke 0.2s ease',
        }),
        chevronIcon: (isOpen) => ({
            position: 'absolute',
            right: '14px',
            width: '18px',
            height: '18px',
            stroke: isOpen ? '#2563EB' : '#94A3B8',
            strokeWidth: '2',
            fill: 'none',
            pointerEvents: 'none',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease, stroke 0.2s ease',
        }),
        selectInput: (isOpen) => ({
            width: '100%',
            height: '48px',
            paddingLeft: '44px',
            paddingRight: '44px',
            borderRadius: '12px',
            border: isOpen ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            fontSize: '15px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: '#0F172A',
            outline: 'none',
            boxSizing: 'border-box',
            cursor: 'pointer',
            boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }),
        fieldHelper: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12.5px',
            color: '#94A3B8',
            marginTop: '6px',
            display: 'block',
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
        dropdownItem: {
            padding: '10px 16px',
            fontSize: '14.5px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: '#1E293B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.15s ease',
        },
        // Added Country Card
        addedCountryCard: {
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            backgroundColor: '#FFFFFF',
            marginTop: '12px',
            boxSizing: 'border-box',
        },
        countryCardHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
        },
        countryNameTitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15.5px',
            fontWeight: '700',
            color: '#0F172A',
            margin: 0,
        },
        removeCountryBtn: {
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '6px',
            padding: '5px 12px',
            fontSize: '12.5px',
            fontWeight: '600',
            color: '#475569',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background-color 0.15s ease',
        },
        questionTitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13.5px',
            fontWeight: '500',
            color: '#334155',
            margin: '0 0 10px 0',
        },
        toggleRow: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '18px',
        },
        toggleBtn: (isActive) => ({
            height: '44px',
            borderRadius: '10px',
            border: isActive ? '2px solid #2563EB' : '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14.5px',
            fontWeight: isActive ? '600' : '500',
            color: '#0F172A',
            boxShadow: isActive ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
            transition: 'all 0.15s ease',
            boxSizing: 'border-box',
        }),
        radioCircle: (isActive) => ({
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: isActive ? '2px solid #2563EB' : '2px solid #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            transition: 'border-color 0.15s ease',
        }),
        radioDot: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#2563EB',
        },
        basisSelectWrapper: {
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
        },
        basisSelect: (isFocused) => ({
            width: '100%',
            height: '46px',
            paddingLeft: '44px',
            paddingRight: '40px',
            borderRadius: '10px',
            border: isFocused ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            fontSize: '14.5px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: '#0F172A',
            outline: 'none',
            boxSizing: 'border-box',
            cursor: 'pointer',
            appearance: 'none',
            boxShadow: isFocused ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }),
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
            marginTop: '32px',
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

            {/* MAIN CONTENT */}
            <main style={styles.mainWrapper}>
                <div style={styles.mainCard}>
                    {/* PROGRESS HEADER */}
                    <div style={styles.progressSection}>
                        <div style={styles.progressHeaderRow}>
                            <span style={styles.progressLabel}>Step 4 of 6</span>
                            <button
                                type="button"
                                onClick={() => navigate('/contact-setup')}
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
                                <span>WORK ELIGIBILITY</span>
                            </div>

                            <h1 style={styles.leftHeading}>
                                Tell us where you can
                                <br />
                                work.
                            </h1>

                            <p style={styles.leftDesc}>
                                We'll use this to show you relevant job opportunities and filter out the ones you can't
                                apply to.
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
                            <h2 style={styles.rightHeading}>Where can you work?</h2>

                            <p style={styles.rightDesc}>
                                Add each country you'd take a job in, then answer a few quick questions for each. We use
                                this to filter out jobs you can't apply to.
                            </p>

                            {/* COUNTRIES OF CITIZENSHIP */}
                            <div ref={citizenshipDropdownRef} style={{ position: 'relative', marginBottom: '20px' }}>
                                <label style={styles.fieldLabel}>Countries of citizenship</label>
                                <div
                                    style={styles.inputWrapper}
                                    onClick={() => setIsCitizenshipOpen(!isCitizenshipOpen)}
                                >
                                    <svg viewBox="0 0 24 24" style={styles.inputIcon(isCitizenshipOpen)}>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="2" y1="12" x2="22" y2="12" />
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                    <input
                                        type="text"
                                        readOnly
                                        value={
                                            citizenshipCountries.length > 0
                                                ? citizenshipCountries.join(', ')
                                                : ''
                                        }
                                        placeholder="Search countries"
                                        style={styles.selectInput(isCitizenshipOpen)}
                                    />
                                    <svg
                                        viewBox="0 0 24 24"
                                        style={styles.chevronIcon(isCitizenshipOpen)}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                                <span style={styles.fieldHelper}>
                                    Select every country where you hold citizenship.
                                </span>

                                {isCitizenshipOpen && (
                                    <ul style={styles.dropdownMenu} role="listbox">
                                        {allCountries.map((c) => {
                                            const isSelected = citizenshipCountries.includes(c);
                                            return (
                                                <li
                                                    key={c}
                                                    style={{
                                                        ...styles.dropdownItem,
                                                        backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                                                        color: isSelected ? '#2563EB' : '#1E293B',
                                                    }}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setCitizenshipCountries((prev) =>
                                                                prev.filter((item) => item !== c)
                                                            );
                                                        } else {
                                                            setCitizenshipCountries((prev) => [...prev, c]);
                                                        }
                                                    }}
                                                >
                                                    <span>{c}</span>
                                                    {isSelected && (
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
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            {/* COUNTRIES WHERE YOU WANT TO WORK */}
                            <div ref={workCountriesDropdownRef} style={{ position: 'relative', marginBottom: '24px' }}>
                                <label style={styles.fieldLabel}>Countries where you want to work</label>
                                <div
                                    style={styles.inputWrapper}
                                    onClick={() => setIsWorkCountriesOpen(!isWorkCountriesOpen)}
                                >
                                    <svg viewBox="0 0 24 24" style={styles.inputIcon(isWorkCountriesOpen)}>
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="2" y1="12" x2="22" y2="12" />
                                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                                    </svg>
                                    <input
                                        type="text"
                                        readOnly
                                        value=""
                                        placeholder="Search and add countries"
                                        style={styles.selectInput(isWorkCountriesOpen)}
                                    />
                                    <svg
                                        viewBox="0 0 24 24"
                                        style={styles.chevronIcon(isWorkCountriesOpen)}
                                    >
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </div>
                                <span style={styles.fieldHelper}>
                                    Add one or more countries where you're open to working.
                                </span>

                                {isWorkCountriesOpen && (
                                    <ul style={styles.dropdownMenu} role="listbox">
                                        {allCountries.map((c) => {
                                            const isAdded = addedCountries.some((item) => item.country === c);
                                            return (
                                                <li
                                                    key={c}
                                                    style={{
                                                        ...styles.dropdownItem,
                                                        backgroundColor: isAdded ? '#F8FAFC' : 'transparent',
                                                        color: isAdded ? '#94A3B8' : '#1E293B',
                                                    }}
                                                    onClick={() => handleAddCountry(c)}
                                                >
                                                    <span>{c}</span>
                                                    {isAdded && <span style={{ fontSize: '12px' }}>Added</span>}
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>

                            {/* ADDED COUNTRIES */}
                            <div>
                                <label style={styles.fieldLabel}>Added countries</label>
                                {addedCountries.map((item) => (
                                    <div key={item.country} style={styles.addedCountryCard}>
                                        <div style={styles.countryCardHeader}>
                                            <h3 style={styles.countryNameTitle}>{item.country}</h3>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCountry(item.country)}
                                                style={styles.removeCountryBtn}
                                                aria-label={`Remove ${item.country}`}
                                            >
                                                ✕ Remove
                                            </button>
                                        </div>

                                        {/* Q1: Legally authorized */}
                                        <p style={styles.questionTitle}>
                                             Are you legally authorized to work in {item.country}?
                                        </p>
                                        <div style={styles.toggleRow}>
                                            <button
                                                type="button"
                                                style={styles.toggleBtn(item.isAuthorized === true)}
                                                onClick={() => updateCountryField(item.country, 'isAuthorized', true)}
                                            >
                                                <span>Yes</span>
                                                <div style={styles.radioCircle(item.isAuthorized === true)}>
                                                    {item.isAuthorized === true && <div style={styles.radioDot} />}
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.toggleBtn(item.isAuthorized === false)}
                                                onClick={() => updateCountryField(item.country, 'isAuthorized', false)}
                                            >
                                                <span>No</span>
                                                <div style={styles.radioCircle(item.isAuthorized === false)}>
                                                    {item.isAuthorized === false && <div style={styles.radioDot} />}
                                                </div>
                                            </button>
                                        </div>

                                        {/* Q2: Employer sponsorship */}
                                        <p style={styles.questionTitle}>
                                            Will you now or in the future require employer sponsorship in {item.country}?
                                        </p>
                                        <div style={styles.toggleRow}>
                                            <button
                                                type="button"
                                                style={styles.toggleBtn(item.requiresSponsorship === true)}
                                                onClick={() =>
                                                    updateCountryField(item.country, 'requiresSponsorship', true)
                                                }
                                            >
                                                <span>Yes</span>
                                                <div style={styles.radioCircle(item.requiresSponsorship === true)}>
                                                    {item.requiresSponsorship === true && (
                                                        <div style={styles.radioDot} />
                                                    )}
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.toggleBtn(item.requiresSponsorship === false)}
                                                onClick={() =>
                                                    updateCountryField(item.country, 'requiresSponsorship', false)
                                                }
                                            >
                                                <span>No</span>
                                                <div style={styles.radioCircle(item.requiresSponsorship === false)}>
                                                    {item.requiresSponsorship === false && (
                                                        <div style={styles.radioDot} />
                                                    )}
                                                </div>
                                            </button>
                                        </div>

                                        {/* Q3: Authorization basis */}
                                        <div>
                                            <label
                                                style={{
                                                    ...styles.fieldLabel,
                                                    fontSize: '12.5px',
                                                    color: '#475569',
                                                    marginBottom: '6px',
                                                }}
                                            >
                                                Authorization basis
                                            </label>
                                            <div style={styles.basisSelectWrapper}>
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    style={{
                                                        position: 'absolute',
                                                        left: '14px',
                                                        width: '18px',
                                                        height: '18px',
                                                        stroke: focusedBasis === item.country ? '#2563EB' : '#94A3B8',
                                                        strokeWidth: '2',
                                                        fill: 'none',
                                                        pointerEvents: 'none',
                                                        transition: 'stroke 0.2s ease',
                                                    }}
                                                >
                                                    <rect x="3" y="4" width="18" height="16" rx="3" />
                                                    <circle cx="9" cy="10" r="2" />
                                                    <line x1="15" y1="8" x2="17" y2="8" />
                                                    <line x1="15" y1="12" x2="17" y2="12" />
                                                    <line x1="7" y1="16" x2="17" y2="16" />
                                                </svg>
                                                <select
                                                    value={item.authorizationBasis}
                                                    onFocus={() => setFocusedBasis(item.country)}
                                                    onBlur={() => setFocusedBasis(null)}
                                                    onChange={(e) =>
                                                        updateCountryField(
                                                            item.country,
                                                            'authorizationBasis',
                                                            e.target.value
                                                        )
                                                    }
                                                    style={styles.basisSelect(focusedBasis === item.country)}
                                                >
                                                    <option value="" disabled>
                                                        Select a status
                                                    </option>
                                                    {authorizationOptions.map((opt) => (
                                                        <option key={opt} value={opt}>
                                                            {opt}
                                                        </option>
                                                    ))}
                                                </select>
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    style={{
                                                        position: 'absolute',
                                                        right: '14px',
                                                        width: '18px',
                                                        height: '18px',
                                                        stroke: focusedBasis === item.country ? '#2563EB' : '#94A3B8',
                                                        strokeWidth: '2',
                                                        fill: 'none',
                                                        pointerEvents: 'none',
                                                        transition: 'stroke 0.2s ease',
                                                    }}
                                                >
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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

export default WorkEligibility;

