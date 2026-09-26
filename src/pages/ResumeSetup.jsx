import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';
import { logoutUser, getStoredUser, getOnboardingState, setOnboardingState } from '../services/api';

const ResumeSetup = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );

    const [userEmail, setUserEmail] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isHoveredContinue, setIsHoveredContinue] = useState(false);

    useEffect(() => {
        const user = getStoredUser();
        if (user.email) setUserEmail(user.email);

        const state = getOnboardingState();
        if (state.resumeName && !selectedFile) {
            setSelectedFile({ name: state.resumeName, size: state.resumeSize || 1024 * 1024 * 1.2 });
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

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    const maxFileSize = 10 * 1024 * 1024; // 10MB

    const handleFileValidationAndSet = (file) => {
        setFileError('');
        if (!file) return;

       
        const fileExtension = file.name.split('.').pop().toLowerCase();
        const isValidExtension = ['pdf', 'doc', 'docx'].includes(fileExtension);
        const isValidMime = allowedTypes.includes(file.type);

        if (!isValidExtension && !isValidMime) {
            setFileError('Invalid file format. Please upload a PDF or DOCX file.');
            setSelectedFile(null);
            return;
        }

        if (file.size > maxFileSize) {
            setFileError('File size exceeds the 10MB limit. Please upload a smaller file.');
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        handleFileValidationAndSet(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        handleFileValidationAndSet(file);
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        setFileError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleContinue = () => {
        if (!selectedFile) return;
        setOnboardingState({
            resumeName: selectedFile?.name,
            resumeSize: selectedFile?.size,
        });
        navigate('/location-setup', { state: { resumeName: selectedFile?.name } });
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const benefits = [
        'AI extracts your experience, skills, and technologies',
        'Your resume powers personalized job matching',
        'Job-specific resume tailoring starts from your real experience',
    ];

    const styles = {
        page: {
            width: '100%',
            minHeight: '100vh',
            backgroundColor: '#F5F3FF',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
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
        progressLabel: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            fontWeight: '500',
            color: '#64748B',
            marginBottom: '10px',
            display: 'block',
        },
        progressBarTrack: {
            width: '100%',
            height: '7px',
            backgroundColor: '#EEF2F7',
            borderRadius: '9999px',
            overflow: 'hidden',
            marginBottom: 'clamp(24px, 2vw, 32px)',
        },
        progressBarFill: {
            width: '16.67%',
            height: '100%',
            background: 'linear-gradient(90deg, #4F46E5, #A855F7)',
            borderRadius: '9999px',
            transition: 'width 0.4s ease',
        },
        progressDivider: {
            width: '100%',
            height: '1px',
            backgroundColor: '#E2E8F0',
        },
        contentGrid: {
            display: 'grid',
            gridTemplateColumns: isDesktop ? '0.75fr 1.25fr' : '1fr',
            gap: isDesktop ? 'clamp(40px, 3.5vw, 56px)' : '36px',
            alignItems: 'stretch',
            width: '100%',
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
        // Right Card
        rightCard: {
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: isMobile ? '24px 18px' : 'clamp(28px, 2.4vw, 36px)',
            minHeight: isDesktop ? '520px' : 'auto',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
        },
        rightBadge: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            color: '#2563EB',
            marginBottom: '12px',
            display: 'inline-block',
        },
        rightHeading: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '800',
            fontSize: 'clamp(28px, 2.3vw, 36px)',
            lineHeight: '1.15',
            color: '#0F172A',
            margin: '0 0 12px 0',
        },
        rightHeadingBlue: {
            color: '#2563EB',
        },
        rightDesc: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            lineHeight: '26px',
            color: '#64748B',
            margin: '0 0 clamp(24px, 2vw, 32px) 0',
            maxWidth: '850px',
        },
        uploadArea: {
            backgroundColor: isDragging ? '#EEF2FF' : '#FBFDFF',
            border: isDragging ? '2px dashed #2563EB' : '1.5px dashed #4F46E5',
            borderRadius: '18px',
            minHeight: '185px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: '24px 20px',
            transition: 'all 0.25s ease',
            boxSizing: 'border-box',
            marginBottom: 'clamp(24px, 2vw, 32px)',
        },
        uploadIconContainer: {
            backgroundColor: '#EFF6FF',
            borderRadius: '9999px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
        },
        cloudUploadSvg: {
            width: '24px',
            height: '24px',
            stroke: '#2563EB',
            strokeWidth: '2',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        uploadMainText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            color: '#0F172A',
            marginBottom: '6px',
            textAlign: 'center',
        },
        browseHighlight: {
            color: '#2563EB',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
        },
        uploadSubText: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '14px',
            color: '#94A3B8',
            margin: 0,
            textAlign: 'center',
        },
        fileSelectedBox: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            maxWidth: '520px',
            padding: '12px 18px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #DCE3EF',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        },
        fileInfoLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            overflow: 'hidden',
        },
        fileIcon: {
            width: '32px',
            height: '32px',
            backgroundColor: '#EEF2FF',
            color: '#4F46E5',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        fileName: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '15px',
            fontWeight: '600',
            color: '#0F172A',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '280px',
            margin: 0,
        },
        fileSize: {
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13px',
            color: '#64748B',
            margin: 0,
        },
        removeBtn: {
            background: 'none',
            border: 'none',
            color: '#EF4444',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'opacity 0.2s ease',
        },
        errorBanner: {
            color: '#EF4444',
            fontSize: '13.5px',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: '500',
            marginTop: '8px',
            textAlign: 'center',
        },
        continueBtn: (enabled, isHovered) => ({
            width: isMobile ? '100%' : '175px',
            height: '48px',
            borderRadius: '12px',
            background: enabled
                ? 'linear-gradient(90deg, #2563EB, #4F46E5)'
                : '#CBD5E1',
            color: '#FFFFFF',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            border: 'none',
            cursor: enabled ? 'pointer' : 'not-allowed',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: enabled
                ? isHovered
                    ? '0px 6px 16px rgba(37, 99, 235, 0.4)'
                    : '0px 4px 8px rgba(37, 99, 235, 0.25)'
                : 'none',
            transform: enabled && isHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.25s ease',
            marginTop: 'auto',
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
            {/* TOP WHITE NAVBAR */}
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

            {/* MAIN CONTAINER */}
            <main style={styles.mainWrapper}>
                <div style={styles.mainCard}>
                    {/* PROGRESS HEADER */}
                    <div style={styles.progressSection}>
                        <span style={styles.progressLabel}>Step 1 of 6</span>
                        <div style={styles.progressBarTrack}>
                            <div style={styles.progressBarFill} />
                        </div>
                        <div style={styles.progressDivider} />
                    </div>

                    {/* TWO COLUMN CONTENT */}
                    <div style={styles.contentGrid}>
                        {/* LEFT COLUMN: BADGE, HEADING, DESCRIPTION, BENEFITS */}
                        <div style={styles.leftCol}>
                            <div style={styles.leftBadge}>
                                <span style={styles.blueDot} />
                                <span>RESUME SETUP</span>
                            </div>

                            <h1 style={styles.leftHeading}>
                                Your resume unlocks
                                <br />
                                better opportunities.
                            </h1>

                            <p style={styles.leftDesc}>
                                Upload your resume and let AutoApply understand your experience, skills, and
                                target roles to find and apply to the most relevant jobs for you.
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

                        {/* RIGHT CARD: INNER UPLOAD BOX */}
                        <div style={styles.rightCard}>
                            <span style={styles.rightBadge}>RESUME SETUP</span>

                            <h2 style={styles.rightHeading}>
                                Let's start with your <span style={styles.rightHeadingBlue}>resume.</span>
                            </h2>

                            <p style={styles.rightDesc}>
                                Upload your latest resume so AutoApply can understand your experience and find
                                better-fit opportunities.
                            </p>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                            />

                            {/* UPLOAD AREA */}
                            <div
                                style={styles.uploadArea}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        fileInputRef.current?.click();
                                    }
                                }}
                            >
                                {!selectedFile ? (
                                    <>
                                        <div style={styles.uploadIconContainer}>
                                            <svg viewBox="0 0 24 24" style={styles.cloudUploadSvg}>
                                                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                                <path d="M12 12v9" />
                                                <path d="m8 16 4-4 4 4" />
                                            </svg>
                                        </div>
                                        <p style={styles.uploadMainText}>
                                            Drop your resume here, or <span style={styles.browseHighlight}>Browse</span>
                                        </p>
                                        <p style={styles.uploadSubText}>PDF or DOCX • Up to 10MB</p>
                                    </>
                                ) : (
                                    <div style={styles.fileSelectedBox} onClick={(e) => e.stopPropagation()}>
                                        <div style={styles.fileInfoLeft}>
                                            <div style={styles.fileIcon}>
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    style={{ width: '18px', height: '18px', stroke: 'currentColor', fill: 'none', strokeWidth: 2 }}
                                                >
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <polyline points="14 2 14 8 20 8" />
                                                    <line x1="16" y1="13" x2="8" y2="13" />
                                                    <line x1="16" y1="17" x2="8" y2="17" />
                                                    <polyline points="10 9 9 9 8 9" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p style={styles.fileName}>{selectedFile.name}</p>
                                                <p style={styles.fileSize}>{formatFileSize(selectedFile.size)}</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleRemoveFile}
                                            style={styles.removeBtn}
                                            aria-label="Remove uploaded resume"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>

                            {fileError && <p style={styles.errorBanner}>{fileError}</p>}

                            {/* CONTINUE BUTTON */}
                            <button
                                type="button"
                                disabled={!selectedFile}
                                onClick={handleContinue}
                                style={styles.continueBtn(!!selectedFile, isHoveredContinue)}
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

export default ResumeSetup;
