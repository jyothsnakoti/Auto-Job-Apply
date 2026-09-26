import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';
import { logoutUser, getStoredUser, getOnboardingState, setOnboardingState } from '../services/api';

const FinalDetails = () => {
    const navigate = useNavigate();

    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    // User email state
    const [userEmail, setUserEmail] = useState('');

    // Form states
    const [openToInPerson, setOpenToInPerson] = useState(null);
    const [willingToRelocate, setWillingToRelocate] = useState(null);
    const [canStartImmediately, setCanStartImmediately] = useState(null);
    const [reliableTransportation, setReliableTransportation] = useState(null);
    const [workplaceAccommodations, setWorkplaceAccommodations] = useState(null); // 'yes' | 'no' | 'prefer-not-to-say'

    const [governmentClearance, setGovernmentClearance] = useState(null);
    const [foreignTies, setForeignTies] = useState(null);

    const [gender, setGender] = useState('');
    const [ethnicity, setEthnicity] = useState('');
    const [veteranStatus, setVeteranStatus] = useState(null); // 'yes' | 'no' | 'prefer-not-to-say'
    const [disabilityStatus, setDisabilityStatus] = useState(null); // 'yes' | 'no' | 'prefer-not-to-say'

    const [additionalNotes, setAdditionalNotes] = useState('');
    const [isHoveredContinue, setIsHoveredContinue] = useState(false);

    useEffect(() => {
        const user = getStoredUser();
        if (user.email) setUserEmail(user.email);

        const savedState = getOnboardingState();
        if (savedState.openToInPerson !== undefined) setOpenToInPerson(savedState.openToInPerson);
        if (savedState.willingToRelocate !== undefined) setWillingToRelocate(savedState.willingToRelocate);
        if (savedState.canStartImmediately !== undefined) setCanStartImmediately(savedState.canStartImmediately);
        if (savedState.reliableTransportation !== undefined) setReliableTransportation(savedState.reliableTransportation);
        if (savedState.needAccommodations !== undefined || savedState.workplaceAccommodations !== undefined) {
            setWorkplaceAccommodations(savedState.needAccommodations ?? savedState.workplaceAccommodations);
        }
        if (savedState.activeGovernmentClearance !== undefined || savedState.governmentClearance !== undefined) {
            setGovernmentClearance(savedState.activeGovernmentClearance ?? savedState.governmentClearance);
        }
        if (savedState.foreignGovernmentTies !== undefined || savedState.foreignTies !== undefined) {
            setForeignTies(savedState.foreignGovernmentTies ?? savedState.foreignTies);
        }
        if (savedState.gender) setGender(savedState.gender);
        if (savedState.raceEthnicity || savedState.ethnicity) setEthnicity(savedState.raceEthnicity || savedState.ethnicity);
        if (savedState.veteranStatus !== undefined) setVeteranStatus(savedState.veteranStatus);
        if (savedState.disabilityStatus !== undefined) setDisabilityStatus(savedState.disabilityStatus);
        if (savedState.additionalNotes) setAdditionalNotes(savedState.additionalNotes);
    }, []);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1100;
    const isDesktop = windowWidth >= 1100;

    const benefits = [
        'More relevant job matches',
        'Fewer irrelevant applications',
        'Fully automated form filling',
    ];

    const genderOptions = [
        'Male',
        'Female',
        'Non-binary',
        'Prefer to self-describe',
        'Prefer not to say',
    ];

    const ethnicityOptions = [
        'Asian',
        'Black or African American',
        'Hispanic or Latino',
        'White',
        'Native American or Alaska Native',
        'Native Hawaiian or Other Pacific Islander',
        'Two or More Races',
        'Prefer not to say',
    ];

    const handleContinue = () => {
        setOnboardingState({
            openToInPerson,
            willingToRelocate,
            canStartImmediately,
            reliableTransportation,
            workplaceAccommodations,
            needAccommodations: workplaceAccommodations,
            governmentClearance,
            activeGovernmentClearance: governmentClearance,
            foreignTies,
            foreignGovernmentTies: foreignTies,
            gender,
            ethnicity,
            raceEthnicity: ethnicity,
            veteranStatus,
            disabilityStatus,
            additionalNotes,
        });

        navigate('/application-settings', {
            state: {
                openToInPerson,
                willingToRelocate,
                canStartImmediately,
                reliableTransportation,
                workplaceAccommodations,
                governmentClearance,
                foreignTies,
                gender,
                ethnicity,
                veteranStatus,
                disabilityStatus,
                additionalNotes,
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
            width: '83.33%',
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
            fontSize: '15px',
            lineHeight: '24px',
            color: '#475569',
            margin: '0 0 20px 0',
            maxWidth: '500px',
        },
        whyAskTitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14.5px',
            fontWeight: '700',
            color: '#0F172A',
            margin: '0 0 6px 0',
        },
        whyAskDesc: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14px',
            lineHeight: '22px',
            color: '#64748B',
            margin: '0 0 28px 0',
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
            padding: isMobile ? '20px 16px' : 'clamp(28px, 2.4vw, 36px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            boxSizing: 'border-box',
        },
        sectionLabel: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            color: '#475569',
            marginBottom: '10px',
            display: 'block',
        },
        sectionContainer: {
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        },
        rowItem: {
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            gap: isMobile ? '12px' : '16px',
        },
        rowItemLast: {
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            gap: isMobile ? '12px' : '16px',
        },
        questionLeft: {
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            maxWidth: '460px',
        },
        questionTitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14.5px',
            fontWeight: '600',
            color: '#0F172A',
            margin: 0,
        },
        questionSubtitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12.5px',
            color: '#64748B',
            margin: 0,
        },
        buttonGroup: {
            display: 'inline-flex',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
        },
        choiceBtn: (isActive) => ({
            height: '36px',
            padding: '0 16px',
            backgroundColor: isActive ? '#FFFFFF' : '#FFFFFF',
            color: isActive ? '#2563EB' : '#64748B',
            border: 'none',
            borderRight: '1px solid #E2E8F0',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13.5px',
            fontWeight: isActive ? '700' : '500',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: isActive ? '1.5px solid #2563EB' : 'none',
            zIndex: isActive ? 2 : 1,
            transition: 'all 0.15s ease',
        }),
        choiceBtnLast: (isActive) => ({
            height: '36px',
            padding: '0 16px',
            backgroundColor: isActive ? '#FFFFFF' : '#FFFFFF',
            color: isActive ? '#2563EB' : '#64748B',
            border: 'none',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13.5px',
            fontWeight: isActive ? '700' : '500',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            outline: isActive ? '1.5px solid #2563EB' : 'none',
            zIndex: isActive ? 2 : 1,
            transition: 'all 0.15s ease',
        }),
        selectWrapper: {
            position: 'relative',
            width: isMobile ? '100%' : '200px',
            flexShrink: 0,
        },
        selectInput: {
            width: '100%',
            height: '38px',
            paddingLeft: '14px',
            paddingRight: '32px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            fontSize: '13.5px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: '#0F172A',
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
        },
        selectChevron: {
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            stroke: '#94A3B8',
            strokeWidth: '2',
            fill: 'none',
            pointerEvents: 'none',
        },
        notesCard: {
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '20px',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
        },
        notesTitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            color: '#0F172A',
            margin: '0 0 4px 0',
        },
        notesSubtitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12.5px',
            color: '#94A3B8',
            margin: '0 0 14px 0',
        },
        textareaWrapper: {
            position: 'relative',
            width: '100%',
        },
        notesTextarea: {
            width: '100%',
            minHeight: '90px',
            padding: '12px 14px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            fontSize: '14px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            color: '#0F172A',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
        },
        charCounter: {
            position: 'absolute',
            right: '12px',
            bottom: '10px',
            fontSize: '11.5px',
            color: '#94A3B8',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
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
            marginTop: '12px',
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
                            <span style={styles.progressLabel}>Step 5 of 6</span>
                            <button
                                type="button"
                                onClick={() => navigate('/work-eligibility')}
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
                                <span>QUICK CHECKLIST</span>
                            </div>

                            <h1 style={styles.leftHeading}>Final Details</h1>

                            <p style={styles.leftDesc}>
                                Help us tailor your applications and avoid roles that don't fit. You can change these
                                anytime in your settings.
                            </p>

                            <h2 style={styles.whyAskTitle}>Why we ask</h2>

                            <p style={styles.whyAskDesc}>
                                These details help us match you with the right opportunities and fill application forms
                                accurately.
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
                            {/* SECTION 1: WORK PREFERENCES */}
                            <div>
                                <label style={styles.sectionLabel}>WORK PREFERENCES</label>
                                <div style={styles.sectionContainer}>
                                    {/* Open to in-person */}
                                    <div style={styles.rowItem}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Open to in-person work?</p>
                                            <p style={styles.questionSubtitle}>Include on-site roles in your job search.</p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(openToInPerson === true)}
                                                onClick={() => setOpenToInPerson(true)}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(openToInPerson === false)}
                                                onClick={() => setOpenToInPerson(false)}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>

                                    {/* Willing to relocate */}
                                    <div style={styles.rowItem}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Willing to relocate?</p>
                                            <p style={styles.questionSubtitle}>Include roles in other cities or countries.</p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(willingToRelocate === true)}
                                                onClick={() => setWillingToRelocate(true)}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(willingToRelocate === false)}
                                                onClick={() => setWillingToRelocate(false)}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>

                                    {/* Can start immediately */}
                                    <div style={styles.rowItem}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Can start immediately?</p>
                                            <p style={styles.questionSubtitle}>Helps us prioritize roles with urgent hiring needs.</p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(canStartImmediately === true)}
                                                onClick={() => setCanStartImmediately(true)}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(canStartImmediately === false)}
                                                onClick={() => setCanStartImmediately(false)}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>

                                    {/* Reliable transportation */}
                                    <div style={styles.rowItem}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Reliable transportation?</p>
                                            <p style={styles.questionSubtitle}>Used for on-site and hybrid roles.</p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(reliableTransportation === true)}
                                                onClick={() => setReliableTransportation(true)}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(reliableTransportation === false)}
                                                onClick={() => setReliableTransportation(false)}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>

                                    {/* Need workplace accommodations */}
                                    <div style={styles.rowItemLast}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Need workplace accommodations?</p>
                                            <p style={styles.questionSubtitle}>Disability, religious, or other.</p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(workplaceAccommodations === 'yes')}
                                                onClick={() => setWorkplaceAccommodations('yes')}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(workplaceAccommodations === 'no')}
                                                onClick={() => setWorkplaceAccommodations('no')}
                                            >
                                                No
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(workplaceAccommodations === 'prefer-not-to-say')}
                                                onClick={() => setWorkplaceAccommodations('prefer-not-to-say')}
                                            >
                                                Prefer not to say
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: BACKGROUND */}
                            <div>
                                <label style={styles.sectionLabel}>BACKGROUND</label>
                                <div style={styles.sectionContainer}>
                                    {/* Government clearance */}
                                    <div style={styles.rowItem}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Active government clearance?</p>
                                            <p style={styles.questionSubtitle}>Include roles that require security clearance.</p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(governmentClearance === true)}
                                                onClick={() => setGovernmentClearance(true)}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(governmentClearance === false)}
                                                onClick={() => setGovernmentClearance(false)}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>

                                    {/* Family ties */}
                                    <div style={styles.rowItemLast}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Family ties to foreign governments?</p>
                                            <p style={styles.questionSubtitle}>Some employers are required to ask.</p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(foreignTies === true)}
                                                onClick={() => setForeignTies(true)}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(foreignTies === false)}
                                                onClick={() => setForeignTies(false)}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: DIVERSITY & INCLUSION (OPTIONAL) */}
                            <div>
                                <label style={styles.sectionLabel}>DIVERSITY & INCLUSION (OPTIONAL)</label>
                                <div style={styles.sectionContainer}>
                                    {/* Gender */}
                                    <div style={styles.rowItem}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Gender</p>
                                        </div>
                                        <div style={styles.selectWrapper}>
                                            <select
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                                style={styles.selectInput}
                                            >
                                                <option value="">Select...</option>
                                                {genderOptions.map((g) => (
                                                    <option key={g} value={g}>
                                                        {g}
                                                    </option>
                                                ))}
                                            </select>
                                            <svg viewBox="0 0 24 24" style={styles.selectChevron}>
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Race / Ethnicity */}
                                    <div style={styles.rowItem}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Race / Ethnicity</p>
                                        </div>
                                        <div style={styles.selectWrapper}>
                                            <select
                                                value={ethnicity}
                                                onChange={(e) => setEthnicity(e.target.value)}
                                                style={styles.selectInput}
                                            >
                                                <option value="">Select...</option>
                                                {ethnicityOptions.map((eth) => (
                                                    <option key={eth} value={eth}>
                                                        {eth}
                                                    </option>
                                                ))}
                                            </select>
                                            <svg viewBox="0 0 24 24" style={styles.selectChevron}>
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Veteran status */}
                                    <div style={styles.rowItem}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Veteran status</p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(veteranStatus === 'yes')}
                                                onClick={() => setVeteranStatus('yes')}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(veteranStatus === 'no')}
                                                onClick={() => setVeteranStatus('no')}
                                            >
                                                No
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(veteranStatus === 'prefer-not-to-say')}
                                                onClick={() => setVeteranStatus('prefer-not-to-say')}
                                            >
                                                Prefer not to say
                                            </button>
                                        </div>
                                    </div>

                                    {/* Disability status */}
                                    <div style={styles.rowItemLast}>
                                        <div style={styles.questionLeft}>
                                            <p style={styles.questionTitle}>Disability status</p>
                                            <p style={styles.questionSubtitle}>Employers may request this information.</p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(disabilityStatus === 'yes')}
                                                onClick={() => setDisabilityStatus('yes')}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(disabilityStatus === 'no')}
                                                onClick={() => setDisabilityStatus('no')}
                                            >
                                                No
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(disabilityStatus === 'prefer-not-to-say')}
                                                onClick={() => setDisabilityStatus('prefer-not-to-say')}
                                            >
                                                Prefer not to say
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: ADDITIONAL INFO (OPTIONAL) */}
                            <div>
                                <label style={styles.sectionLabel}>ADDITIONAL INFO (OPTIONAL)</label>
                                <div style={styles.notesCard}>
                                    <p style={styles.notesTitle}>
                                        Anything else we should know when filling applications?
                                    </p>
                                    <p style={styles.notesSubtitle}>
                                        e.g. notice period, interest in specific companies, willing to travel up to 50%,
                                        etc.
                                    </p>
                                    <div style={styles.textareaWrapper}>
                                        <textarea
                                            value={additionalNotes}
                                            maxLength={500}
                                            onChange={(e) => setAdditionalNotes(e.target.value)}
                                            placeholder="Optional notes..."
                                            style={styles.notesTextarea}
                                        />
                                        <span style={styles.charCounter}>{additionalNotes.length}/500</span>
                                    </div>
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

export default FinalDetails;
