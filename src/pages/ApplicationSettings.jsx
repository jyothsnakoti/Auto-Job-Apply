import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';
import {
    logoutUser,
    getOnboardingState,
    setOnboardingState,
    buildOnboardingPayload,
    submitOnboarding,
} from '../services/api';

const ApplicationSettings = () => {
    const navigate = useNavigate();

    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    // Form states
    const [resumeTailoring, setResumeTailoring] = useState('job-specific'); // 'original' | 'job-specific'
    const [autoApproveEdits, setAutoApproveEdits] = useState(true); // true | false
    const [automationMode, setAutomationMode] = useState('automatic'); // 'automatic' | 'review-before-submit'
    const [coverLetterMode, setCoverLetterMode] = useState('auto-generate'); // 'auto-generate' | 'none'
    const [questionMode, setQuestionMode] = useState('saved-answers'); // 'saved-answers' | 'ask-when-needed'

    const [isHoveredContinue, setIsHoveredContinue] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        const savedState = getOnboardingState();
        if (savedState.resumeOptimization || savedState.resumeTailoring) {
            setResumeTailoring(savedState.resumeOptimization || savedState.resumeTailoring);
        }
        if (savedState.autoApproveEdits !== undefined) {
            setAutoApproveEdits(savedState.autoApproveEdits);
        }
        if (savedState.automationMode) {
            setAutomationMode(savedState.automationMode);
        } else if (savedState.reviewBeforeSubmit !== undefined) {
            setAutomationMode(savedState.reviewBeforeSubmit ? 'review-before-submit' : 'automatic');
        }
        if (savedState.coverLetterMode) {
            setCoverLetterMode(savedState.coverLetterMode);
        }
        if (savedState.questionMode) {
            setQuestionMode(savedState.questionMode);
        }
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
        'Higher response rates',
        'Better job matches',
        'Fully automated applications',
    ];

    const handleContinue = async () => {
        if (isSubmitting) return;
        setErrorMessage('');

        // Update current settings to common state
        const updatedState = setOnboardingState({
            resumeOptimization: resumeTailoring || 'job-specific',
            resumeTailoring: resumeTailoring || 'job-specific',
            autoApproveEdits: autoApproveEdits !== null ? autoApproveEdits : true,
            reviewBeforeSubmit: automationMode === 'review-before-submit',
            automationMode: automationMode || 'automatic',
            coverLetterMode: coverLetterMode || 'auto-generate',
            questionMode: questionMode || 'saved-answers',
        });

        // Validation of collected onboarding fields
        if (!updatedState.addressLine1 && !updatedState.address) {
            setErrorMessage('Location address is missing. Please go back to Step 2 and enter your address.');
            return;
        }

        if (!updatedState.phone && !updatedState.phoneNumber) {
            setErrorMessage('Phone number is missing. Please go back to Step 3 and enter your phone number.');
            return;
        }

        setIsSubmitting(true);

        try {
            const payload = buildOnboardingPayload(updatedState);
            const response = await submitOnboarding(payload);

            // Display success toast notification
            const successMsg = response?.message || 'Onboarding completed successfully!';
            setToastMessage(successMsg);
            setShowToast(true);

            // Navigate to dashboard after toast
            setTimeout(() => {
                navigate('/dashboard');
            }, 1400);
        } catch (error) {
            console.error('Failed to complete onboarding:', error);
            setErrorMessage(
                error.message || 'An error occurred while saving your onboarding details. Please try again.'
            );
            setIsSubmitting(false);
        }
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
            width: '100%',
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
        optionsContainer: {
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        radioCard: (isSelected) => ({
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: isSelected ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
            backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
        }),
        radioCircle: (isSelected) => ({
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: isSelected ? '2px solid #2563EB' : '2px solid #CBD5E1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
            marginTop: '2px',
        }),
        radioDot: {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#2563EB',
        },
        optionContent: {
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
        },
        optionTitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14.5px',
            fontWeight: '700',
            color: '#0F172A',
            margin: 0,
        },
        optionSubtitle: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13px',
            lineHeight: '19px',
            color: '#64748B',
            margin: 0,
        },
        nestedRow: {
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            padding: '12px 14px 4px 14px',
            gap: isMobile ? '10px' : '16px',
        },
        buttonGroup: {
            display: 'inline-flex',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            overflow: 'hidden',
            flexShrink: 0,
        },
        choiceBtn: (isActive) => ({
            height: '34px',
            padding: '0 16px',
            backgroundColor: '#FFFFFF',
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
            height: '34px',
            padding: '0 16px',
            backgroundColor: '#FFFFFF',
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
        warningBanner: {
            backgroundColor: '#FFFBEB',
            border: '1px solid #FEF3C7',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '12.5px',
            lineHeight: '19px',
            color: '#B45309',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            marginTop: '4px',
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
                            <span style={styles.progressLabel}>Step 6 of 6</span>
                            <button
                                type="button"
                                onClick={() => navigate('/final-details')}
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
                                <span>APPLICATION SETTINGS</span>
                            </div>

                            <h1 style={styles.leftHeading}>
                                How should we
                                <br />
                                apply for you?
                            </h1>

                            <p style={styles.leftDesc}>
                                Choose how we optimize and submit your applications. You can change these settings
                                anytime.
                            </p>

                            <h2 style={styles.whyAskTitle}>Why we ask</h2>

                            <p style={styles.whyAskDesc}>
                                These settings control how we tailor your resume, complete applications, and when
                                you'll be asked to step in during the process.
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
                            {errorMessage && (
                                <div
                                    style={{
                                        marginBottom: '20px',
                                        padding: '12px 16px',
                                        backgroundColor: '#FEF2F2',
                                        border: '1px solid #FECACA',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        color: '#B91C1C',
                                        fontSize: '13.5px',
                                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                                        fontWeight: '500',
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            stroke: '#DC2626',
                                            strokeWidth: '2',
                                            fill: 'none',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* SECTION 1: RESUME TAILORING */}
                            <div>
                                <label style={styles.sectionLabel}>RESUME TAILORING</label>
                                <div style={styles.optionsContainer}>
                                    <div
                                        style={styles.radioCard(resumeTailoring === 'original')}
                                        onClick={() => setResumeTailoring('original')}
                                    >
                                        <div style={styles.radioCircle(resumeTailoring === 'original')}>
                                            {resumeTailoring === 'original' && <div style={styles.radioDot} />}
                                        </div>
                                        <div style={styles.optionContent}>
                                            <p style={styles.optionTitle}>Use original resume</p>
                                            <p style={styles.optionSubtitle}>Use my resume exactly as uploaded.</p>
                                        </div>
                                    </div>

                                    <div
                                        style={styles.radioCard(resumeTailoring === 'job-specific')}
                                        onClick={() => setResumeTailoring('job-specific')}
                                    >
                                        <div style={styles.radioCircle(resumeTailoring === 'job-specific')}>
                                            {resumeTailoring === 'job-specific' && <div style={styles.radioDot} />}
                                        </div>
                                        <div style={styles.optionContent}>
                                            <p style={styles.optionTitle}>Job Specific</p>
                                            <p style={styles.optionSubtitle}>
                                                Automatically tailor my resume to each job description while keeping my
                                                experience accurate.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sub-option: Auto-approve edits */}
                                    <div style={styles.nestedRow}>
                                        <div style={styles.optionContent}>
                                            <p style={styles.optionTitle}>Auto-approve edits?</p>
                                            <p style={styles.optionSubtitle}>
                                                Skip the preview step and send optimized files straight through.
                                            </p>
                                        </div>
                                        <div style={styles.buttonGroup}>
                                            <button
                                                type="button"
                                                style={styles.choiceBtn(autoApproveEdits === true)}
                                                onClick={() => setAutoApproveEdits(true)}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                style={styles.choiceBtnLast(autoApproveEdits === false)}
                                                onClick={() => setAutoApproveEdits(false)}
                                            >
                                                No
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: APPLICATION AUTOMATION */}
                            <div>
                                <label style={styles.sectionLabel}>APPLICATION AUTOMATION</label>
                                <div style={styles.optionsContainer}>
                                    <div
                                        style={styles.radioCard(automationMode === 'automatic')}
                                        onClick={() => setAutomationMode('automatic')}
                                    >
                                        <div style={styles.radioCircle(automationMode === 'automatic')}>
                                            {automationMode === 'automatic' && <div style={styles.radioDot} />}
                                        </div>
                                        <div style={styles.optionContent}>
                                            <p style={styles.optionTitle}>Automatic</p>
                                            <p style={styles.optionSubtitle}>
                                                Automatically complete and submit supported applications after ATS validation.
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        style={styles.radioCard(automationMode === 'review-before-submit')}
                                        onClick={() => setAutomationMode('review-before-submit')}
                                    >
                                        <div style={styles.radioCircle(automationMode === 'review-before-submit')}>
                                            {automationMode === 'review-before-submit' && (
                                                <div style={styles.radioDot} />
                                            )}
                                        </div>
                                        <div style={styles.optionContent}>
                                            <p style={styles.optionTitle}>Review before submit</p>
                                            <p style={styles.optionSubtitle}>
                                                Pause so you can review the application before submission.
                                            </p>
                                        </div>
                                    </div>

                                    <div style={styles.warningBanner}>
                                        Some applications may require manual intervention if there is a CAPTCHA,
                                        unsupported questions, or if we're unsure about the submission status.
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: COVER LETTER */}
                            <div>
                                <label style={styles.sectionLabel}>COVER LETTER</label>
                                <div style={styles.optionsContainer}>
                                    <div
                                        style={styles.radioCard(coverLetterMode === 'auto-generate')}
                                        onClick={() => setCoverLetterMode('auto-generate')}
                                    >
                                        <div style={styles.radioCircle(coverLetterMode === 'auto-generate')}>
                                            {coverLetterMode === 'auto-generate' && <div style={styles.radioDot} />}
                                        </div>
                                        <div style={styles.optionContent}>
                                            <p style={styles.optionTitle}>Auto-generate cover letters</p>
                                            <p style={styles.optionSubtitle}>
                                                Create a tailored cover letter for each job using your profile and the
                                                job description.
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        style={styles.radioCard(coverLetterMode === 'none')}
                                        onClick={() => setCoverLetterMode('none')}
                                    >
                                        <div style={styles.radioCircle(coverLetterMode === 'none')}>
                                            {coverLetterMode === 'none' && <div style={styles.radioDot} />}
                                        </div>
                                        <div style={styles.optionContent}>
                                            <p style={styles.optionTitle}>Don't include cover letters</p>
                                            <p style={styles.optionSubtitle}>Only submit your resume.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: APPLICATION QUESTIONS */}
                            <div>
                                <label style={styles.sectionLabel}>APPLICATION QUESTIONS</label>
                                <div style={styles.optionsContainer}>
                                    <div
                                        style={styles.radioCard(questionMode === 'saved-answers')}
                                        onClick={() => setQuestionMode('saved-answers')}
                                    >
                                        <div style={styles.radioCircle(questionMode === 'saved-answers')}>
                                            {questionMode === 'saved-answers' && <div style={styles.radioDot} />}
                                        </div>
                                        <div style={styles.optionContent}>
                                            <p style={styles.optionTitle}>Use saved answers</p>
                                            <p style={styles.optionSubtitle}>
                                                Use your verified profile answers for supported questions.
                                            </p>
                                        </div>
                                    </div>

                                    <div
                                        style={styles.radioCard(questionMode === 'ask-when-needed')}
                                        onClick={() => setQuestionMode('ask-when-needed')}
                                    >
                                        <div style={styles.radioCircle(questionMode === 'ask-when-needed')}>
                                            {questionMode === 'ask-when-needed' && <div style={styles.radioDot} />}
                                        </div>
                                        <div style={styles.optionContent}>
                                            <p style={styles.optionTitle}>Ask me when needed</p>
                                            <p style={styles.optionSubtitle}>
                                                Pause when a question needs information that is not already saved.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CONTINUE BUTTON */}
                            <button
                                type="button"
                                onClick={handleContinue}
                                disabled={isSubmitting}
                                style={{
                                    ...styles.continueBtn(isHoveredContinue),
                                    opacity: isSubmitting ? 0.7 : 1,
                                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                }}
                                onMouseEnter={() => setIsHoveredContinue(true)}
                                onMouseLeave={() => setIsHoveredContinue(false)}
                            >
                                <span>{isSubmitting ? 'Completing Setup...' : 'Continue'}</span>
                                {!isSubmitting && (
                                    <svg viewBox="0 0 24 24" style={styles.arrowSvg}>
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            {/* TOAST NOTIFICATION POPUP */}
            {showToast && (
                <div
                    style={{
                        position: 'fixed',
                        top: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        backgroundColor: '#FFFFFF',
                        border: '1.5px solid #10B981',
                        borderRadius: '16px',
                        boxShadow: '0 20px 30px -10px rgba(16, 185, 129, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.08)',
                        padding: '14px 22px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        maxWidth: '90vw',
                        animation: 'fadeInSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                >
                    <div
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: '#ECFDF5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            style={{
                                width: '18px',
                                height: '18px',
                                stroke: '#10B981',
                                strokeWidth: '2.5',
                                fill: 'none',
                                strokeLinecap: 'round',
                                strokeLinejoin: 'round',
                            }}
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                            style={{
                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                fontSize: '14.5px',
                                fontWeight: '700',
                                color: '#065F46',
                            }}
                        >
                            {toastMessage || 'Onboarding completed!'}
                        </span>
                        <span
                            style={{
                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                fontSize: '12.5px',
                                color: '#64748B',
                                marginTop: '1px',
                            }}
                        >
                            Redirecting you to the dashboard...
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicationSettings;
