import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import image2044 from '../assets/home/ChatGPT Image Sep 25, 2026, 03_44_44 PM.png';
import image2045 from '../assets/home/ChatGPT Image Sep 25, 2026, 03_47_37 PM.png';
import image2046 from '../assets/home/ChatGPT Image Sep 25, 2026, 03_50_54 PM.png';
import image2047 from '../assets/home/ChatGPT Image Sep 25, 2026, 03_53_16 PM.png';

// Company logo SVGs
import googleLogo from '../assets/home/Google_2015_logo.svg';
import microsoftLogo from '../assets/home/microsoft-logo-svgrepo-com.svg';
import adobeLogo from '../assets/home/Adobe_Corporate_logo.svg';
import amazonLogo from '../assets/home/Amazon_(company)-Logo.wine.svg';
import deloitteLogo from '../assets/home/Deloitte-Logo.wine.svg';
import ibmLogo from '../assets/home/IBM_logo.svg';
import metaLogo from '../assets/home/Meta_Platforms_Inc._logo.svg';

// How It Works Step Icons
import discoverIcon from '../assets/home/hugeicons_discover-circle.svg';
import matchIcon from '../assets/home/fluent_document-target-16-regular.svg';
import prepareIcon from '../assets/home/iconmind_pre-order-outline-thin.svg';
import applyIcon from '../assets/home/iconoir_submit-document.svg';

const Home = () => {
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );
    const [isCtaHovered, setIsCtaHovered] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1100;
    const isDesktop = windowWidth >= 1100;

    const features = [
        'No manual applying',
        'Job-specific resumes',
        'Track everything',
    ];

    const howItWorksSteps = [
        {
            step: 'DISCOVER',
            title: 'Find relevant jobs',
            description: 'Find relevant jobs from company career sites and major job boards automatically.',
            icon: discoverIcon,
        },
        {
            step: 'MATCH',
            title: 'Get ATS score',
            description: 'Get an AI-powered ATS score and see how well you fit before applying.',
            icon: matchIcon,
        },
        {
            step: 'PREPARE',
            title: 'Generate resume',
            description: 'Generate a tailored, ATS-friendly resume crafted specifically for each role.',
            icon: prepareIcon,
        },
        {
            step: 'APPLY',
            title: 'Automate submissions',
            description: 'Let our automation agent handle the tedious application forms on portals.',
            icon: applyIcon,
        },
        {
            step: 'TRACK',
            title: 'Track everything',
            description: 'Track every application status, responses, and stay updated in one place.',
            isCustomTrack: true,
        },
    ];

    const [isMatchingCtaHovered, setIsMatchingCtaHovered] = useState(false);
    const [isResumeCtaHovered, setIsResumeCtaHovered] = useState(false);
    const [isAutomationCtaHovered, setIsAutomationCtaHovered] = useState(false);
    const [isBasicCtaHovered, setIsBasicCtaHovered] = useState(false);
    const [isProCtaHovered, setIsProCtaHovered] = useState(false);
    const [isBasicCardHovered, setIsBasicCardHovered] = useState(false);
    const [isProCardHovered, setIsProCardHovered] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (index) => {
        setOpenFaq((prev) => (prev === index ? null : index));
    };

    const matchBreakdownData = [
        { label: 'Skills', percentage: 95 },
        { label: 'Experience', percentage: 90 },
        { label: 'Role Relevance', percentage: 94 },
        { label: 'Technology', percentage: 96 },
        { label: 'Location', percentage: 88 },
        { label: 'Preferences', percentage: 91 },
    ];

    const matchingBullets = [
        'Component-wise score breakdown',
        'Matching skills, gaps and recommendations',
        'Only show relevant, high-quality opportunities',
    ];

    const resumeBullets = [
        'AI-powered resume tailoring without fabricating experience',
        'Identify skill gaps and optimize role keyword density',
        'Optimized for top enterprise ATS systems like Workday and Greenhouse',
    ];

    const automationCompletedSteps = [
        { title: 'Job verified', status: 'Completed' },
        { title: 'Resume tailored', status: 'Completed' },
        { title: 'ATS validation passed', status: 'Completed' },
    ];

    const automationPendingSteps = [
        { title: 'Filling application...', status: 'Pending' },
        { title: 'Uploading resume', status: 'Pending' },
        { title: 'Submitting application', status: 'Pending' },
    ];

    const automationFeatures = [
        'Automated form filling',
        'Resume upload and submission',
        'Handles multiple job boards and career sites',
    ];

    const pricingFeatures = [
        'Job discovery',
        'ATS matching',
        'Resume tailoring',
        'Automated applications',
        'Application tracking',
        'Dashboard & insights',
    ];

    const faqItems = [
        {
            question: 'How does AutoApply find jobs?',
            answer:
                'We continuously index verified career pages of thousands of enterprises and startups worldwide alongside top reputable tech job boards to surface fresh postings minutes after they go live.',
        },
        {
            question: 'How is my ATS score calculated?',
            answer:
                'We mimic enterprise ATS parsing engines to score keyword overlap, verified years of experience, tooling familiarity, and scope relevance between your profile and the job description.',
        },
        {
            question: 'Will the AI invent experience for my resume?',
            answer:
                'Never. Our AI strictly uses your confirmed skills, projects, and career milestones. It optimizes wording, clarity, and structural keyword hierarchy without hallucinating false credentials.',
        },
        {
            question: 'What happens if an application cannot be completed?',
            answer:
                'If an employer uses a custom non-standard portal, complex multi-image CAPTCHAs, or unique subjective assessments, AutoApply alerts you instantly with a direct link to finalize the last step yourself.',
        },
    ];

    const styles = {
        container: {
            width: '100%',
            minHeight: '100vh',
            backgroundColor: 'rgba(10, 15, 32, 1)',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: '#FFFFFF',
            overflowX: 'hidden',
        },
        heroSection: {
            position: 'relative',
            width: '100%',
            flexGrow: 1,
            minHeight: isMobile ? 'auto' : 'clamp(790px, calc(100vh - 72px), 830px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: isMobile ? '50px' : 'clamp(60px, 4.5vw, 85px)',
            paddingBottom: isMobile ? '50px' : 'clamp(50px, 4vw, 75px)',
            paddingLeft: isMobile ? '20px' : '32px',
            paddingRight: isMobile ? '20px' : '32px',
            boxSizing: 'border-box',
            overflow: 'hidden',
        },
        // Floating Decorative Images
        topLeftCard: {
            position: 'absolute',
            left: isTablet ? '2%' : '4%',
            top: isTablet ? '8%' : '10%',
            width: isTablet ? '210px' : '280px',
            transform: 'rotate(-6deg)',
            zIndex: 1,
            pointerEvents: 'none',
            display: isMobile ? 'none' : 'block',
            filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.4))',
            userSelect: 'none',
        },
        topRightCard: {
            position: 'absolute',
            right: isTablet ? '2%' : '4%',
            top: isTablet ? '8%' : '10%',
            width: isTablet ? '210px' : '280px',
            transform: 'rotate(6deg)',
            zIndex: 1,
            pointerEvents: 'none',
            display: isMobile ? 'none' : 'block',
            filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.4))',
            userSelect: 'none',
        },
        bottomLeftCard: {
            position: 'absolute',
            left: isTablet ? '3%' : '5%',
            bottom: isTablet ? '6%' : '8%',
            width: isTablet ? '210px' : '280px',
            transform: 'rotate(4deg)',
            zIndex: 1,
            pointerEvents: 'none',
            display: isMobile ? 'none' : 'block',
            filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.4))',
            userSelect: 'none',
        },
        bottomRightCard: {
            position: 'absolute',
            right: isTablet ? '3%' : '5%',
            bottom: isTablet ? '6%' : '8%',
            width: isTablet ? '210px' : '280px',
            transform: 'rotate(-5deg)',
            zIndex: 1,
            pointerEvents: 'none',
            display: isMobile ? 'none' : 'block',
            filter: 'drop-shadow(0 20px 30px rgba(0, 0, 0, 0.4))',
            userSelect: 'none',
        },
        // Central Content Area
        contentWrapper: {
            position: 'relative',
            zIndex: 10,
            maxWidth: isDesktop ? '1100px' : '860px',
            width: '100%',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },
        // Main Heading
        heading: {
            margin: '0 0 24px 0',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(36px, 5vw, 96px)',
            fontWeight: '800',
            lineHeight: '1.111',
            letterSpacing: '-0.025em',
            color: 'rgba(255, 255, 255, 1)',
            textAlign: 'center',
            verticalAlign: 'middle',
        },
        headingGradient: {
            background: 'linear-gradient(102.56deg, #818CF8 0%, #C084FC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'inline-block',
        },
        // Description Paragraph
        description: {
            margin: '0 0 38px 0',
            maxWidth: '660px',
            fontSize: isMobile ? '15px' : '17px',
            lineHeight: '1.6',
            fontWeight: '400',
            color: 'rgba(148, 163, 184, 1)',
            textAlign: 'center',
        },
        // CTA Button
        ctaButton: {
            backgroundColor: isCtaHovered ? 'rgba(67, 56, 202, 1)' : 'rgba(79, 70, 229, 1)',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: '600',
            padding: '14px 30px',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            textDecoration: 'none',
            boxShadow: isCtaHovered
                ? '0 8px 25px -4px rgba(79, 70, 229, 0.5)'
                : '0 4px 14px 0 rgba(79, 70, 229, 0.35)',
            transform: isCtaHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.25s ease',
            marginBottom: '0',
        },
        arrowIcon: {
            width: '18px',
            height: '18px',
            strokeWidth: '2.4',
            stroke: 'currentColor',
            fill: 'none',
            display: 'inline-block',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isCtaHovered ? 'translateX(3px)' : 'none',
        },
        // Feature Row
        featureRow: {
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '14px' : '36px',
            padding: 0,
            margin: isMobile ? '36px 0 0 0' : 'clamp(60px, 5.2vw, 90px) 0 0 0',
            listStyle: 'none',
        },
        featureItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(203, 213, 225, 0.85)',
            fontSize: '14px',
            fontWeight: '500',
            letterSpacing: '-0.01em',
        },
        checkIcon: {
            width: '18px',
            height: '18px',
            color: '#10B981',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2.2',
            flexShrink: 0,
        },
        // Trusted By Section
        trustedSection: {
            width: '100%',
            backgroundColor: 'rgba(8, 11, 20, 1)',
            paddingTop: isMobile ? '28px' : '36px',
            paddingBottom: isMobile ? '32px' : '44px',
            paddingLeft: isMobile ? '20px' : isTablet ? '32px' : '48px',
            paddingRight: isMobile ? '20px' : isTablet ? '32px' : '48px',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        },
        trustedHeading: {
            fontSize: isMobile ? '11px' : '12px',
            fontWeight: '600',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(148, 163, 184, 0.65)',
            textAlign: 'center',
            margin: '0 0 24px 0',
        },
        logoRow: {
            width: '100%',
            maxWidth: isDesktop ? '1320px' : '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isDesktop ? '60px' : isTablet ? '36px' : '20px',
            boxSizing: 'border-box',
        },
        logoWrapper: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '44px',
            flexShrink: 0,
        },
        logoGoogle: {
            height: isMobile ? '26px' : '36px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
        },
        logoMicrosoft: {
            height: isMobile ? '26px' : '36px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
        },
        logoAdobe: {
            height: isMobile ? '28px' : '38px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
        },
        logoAmazon: {
            height: isMobile ? '28px' : '40px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
        },
        logoDeloitte: {
            height: isMobile ? '24px' : '34px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
        },
        logoIbm: {
            height: isMobile ? '24px' : '34px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
        },
        logoMeta: {
            height: isMobile ? '24px' : '34px',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
        },
        // How It Works Section
        howItWorksSection: {
            width: '100%',
            backgroundColor: '#FFFFFF',
            paddingTop: 'clamp(60px, 5vw, 100px)',
            paddingBottom: 'clamp(68px, 6vw, 120px)',
            paddingLeft: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4vw, 80px)',
            paddingRight: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4vw, 80px)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        },
        howItWorksLabel: {
            fontSize: 'clamp(12px, 0.75vw, 14px)',
            fontWeight: '700',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(79, 70, 229, 1)',
            textAlign: 'center',
            margin: '0 0 14px 0',
        },
        howItWorksHeading: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(32px, 2.7vw, 50px)',
            fontWeight: '800',
            lineHeight: '1.18',
            letterSpacing: '-0.025em',
            color: 'rgba(15, 23, 42, 1)',
            textAlign: 'center',
            margin: '0 0 18px 0',
        },
        howItWorksDescription: {
            fontSize: 'clamp(15px, 0.95vw, 18.5px)',
            lineHeight: '1.6',
            fontWeight: '400',
            color: 'rgba(100, 116, 139, 1)',
            textAlign: 'center',
            maxWidth: 'clamp(620px, 45vw, 820px)',
            margin: '0 0 clamp(44px, 4.5vw, 72px) 0',
        },
        stepsContainer: {
            width: '100%',
            maxWidth: 'clamp(1240px, 85vw, 1620px)',
            display: 'grid',
            gridTemplateColumns: isMobile
                ? '1fr'
                : isTablet
                    ? 'repeat(2, 1fr)'
                    : 'repeat(5, 1fr)',
            gap: 'clamp(20px, 2.2vw, 44px)',
            boxSizing: 'border-box',
        },
        stepCard: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
        },
        iconBox: {
            width: 'clamp(48px, 2.8vw, 54px)',
            height: 'clamp(48px, 2.8vw, 54px)',
            borderRadius: '14px',
            border: '1px solid rgba(224, 231, 255, 1)',
            backgroundColor: 'rgba(245, 247, 255, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(16px, 1.2vw, 22px)',
            boxSizing: 'border-box',
        },
        iconImg: {
            width: 'clamp(22px, 1.3vw, 25px)',
            height: 'clamp(22px, 1.3vw, 25px)',
            objectFit: 'contain',
            display: 'block',
        },
        stepCategory: {
            fontSize: 'clamp(12px, 0.75vw, 14px)',
            fontWeight: '600',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'rgba(79, 70, 229, 1)',
            margin: '0 0 clamp(8px, 0.6vw, 12px) 0',
        },
        stepTitle: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(17px, 1.1vw, 21px)',
            fontWeight: '700',
            lineHeight: '1.3',
            color: 'rgba(15, 23, 42, 1)',
            margin: '0 0 clamp(8px, 0.6vw, 12px) 0',
        },
        stepDescription: {
            fontSize: 'clamp(14px, 0.88vw, 16.5px)',
            lineHeight: '1.55',
            fontWeight: '400',
            color: 'rgba(100, 116, 139, 1)',
            margin: 0,
            maxWidth: 'clamp(220px, 16vw, 290px)',
        },

        // Intelligent Matching Section
        matchingSection: {
            width: '100%',
            backgroundColor: 'rgba(255, 255, 255, 1)',
            paddingTop: 'clamp(60px, 5.5vw, 110px)',
            paddingBottom: 'clamp(60px, 5.5vw, 110px)',
            paddingLeft: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            paddingRight: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #F1F5F9',
        },
        matchingContainer: {
            width: '100%',
            maxWidth: 'clamp(1400px, 86vw, 1650px)',
            display: 'grid',
            gridTemplateColumns: isMobile || isTablet ? '1fr' : '1.05fr 0.95fr',
            gap: 'clamp(48px, 4.5vw, 90px)',
            alignItems: 'start',
            boxSizing: 'border-box',
        },
        // Left: ATS Match Breakdown Card
        atsCard: {
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: 'clamp(28px, 2.2vw, 38px)',
            boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.05)',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: 'clamp(660px, 48vw, 780px)',
            display: 'flex',
            flexDirection: 'column',
        },
        atsCardHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'clamp(20px, 1.6vw, 28px)',
        },
        atsCardHeading: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(20px, 1.35vw, 24px)',
            fontWeight: '700',
            color: '#0F172A',
            margin: 0,
            lineHeight: '1.2',
        },
        activeEvalPill: {
            backgroundColor: '#ECFDF5',
            color: '#059669',
            fontSize: 'clamp(12px, 0.78vw, 14px)',
            fontWeight: '600',
            padding: '4px 14px',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
        },
        atsCardBody: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'clamp(145px, 9.8vw, 175px) minmax(0, 1fr)',
            alignItems: 'center',
            gap: 'clamp(24px, 2.2vw, 38px)',
            width: '100%',
        },
        atsScoreContainer: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            width: '100%',
        },
        atsRingWrapper: {
            position: 'relative',
            width: 'clamp(145px, 9.5vw, 165px)',
            height: 'clamp(145px, 9.5vw, 165px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        atsRingSvg: {
            width: '100%',
            height: '100%',
            transform: 'rotate(-90deg)',
        },
        atsScoreTextOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
            zIndex: 2,
        },
        atsScoreValue: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(32px, 2.2vw, 40px)',
            fontWeight: '800',
            color: '#0F172A',
            lineHeight: '1',
            letterSpacing: '-0.03em',
            margin: '0 0 4px 0',
        },
        atsScoreLabel: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(11px, 0.72vw, 12.5px)',
            fontWeight: '600',
            color: '#10B981',
            lineHeight: '1.2',
            margin: 0,
            whiteSpace: 'nowrap',
        },
        breakdownRowsList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(12px, 0.9vw, 16px)',
            width: '100%',
        },
        breakdownRow: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
        },
        breakdownMeta: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '5px',
        },
        breakdownLabel: {
            fontSize: 'clamp(13.5px, 0.88vw, 16px)',
            fontWeight: '500',
            color: '#334155',
            lineHeight: '20px',
        },
        breakdownPercentage: {
            fontSize: 'clamp(13.5px, 0.88vw, 16px)',
            fontWeight: '700',
            color: '#0F172A',
            lineHeight: '20px',
        },
        progressBarTrack: {
            width: '100%',
            height: 'clamp(10px, 0.6vw, 11px)',
            backgroundColor: '#F1F5F9',
            borderRadius: '9999px',
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: '#10B981',
            borderRadius: '9999px',
        },

        // Right: Content
        matchingContent: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            textAlign: 'left',
            paddingTop: isDesktop ? '4px' : '0px',
            paddingBottom: isDesktop ? '4px' : '0px',
            maxWidth: '650px',
            height: '100%',
            boxSizing: 'border-box',
        },
        matchingBadge: {
            fontSize: 'clamp(12px, 0.78vw, 14px)',
            fontWeight: '700',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(79, 70, 229, 1)',
            backgroundColor: 'rgba(238, 242, 255, 1)',
            border: '1px solid rgba(224, 231, 255, 0.9)',
            padding: '5px 14px',
            borderRadius: '9999px',
            marginBottom: 'clamp(14px, 1.1vw, 20px)',
            display: 'inline-block',
        },
        matchingHeading: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(36px, 3.2vw, 56px)',
            fontWeight: '800',
            lineHeight: '1.1',
            letterSpacing: '-1.5px',
            color: '#0F172A',
            margin: '0 0 clamp(14px, 1.2vw, 22px) 0',
        },
        matchingDescription: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(16px, 1vw, 18px)',
            lineHeight: 'clamp(24px, 1.6vw, 28px)',
            fontWeight: '400',
            color: '#475569',
            margin: '0 0 clamp(22px, 1.8vw, 30px) 0',
            maxWidth: '650px',
        },
        matchingBulletsList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(12px, 1vw, 16px)',
            marginBottom: 'clamp(26px, 2vw, 32px)',
            width: '100%',
        },
        matchingBulletItem: {
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(10px, 0.8vw, 14px)',
        },
        bulletCheckCircle: {
            width: 'clamp(20px, 1.3vw, 24px)',
            height: 'clamp(20px, 1.3vw, 24px)',
            borderRadius: '50%',
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        bulletCheckSvg: {
            width: 'clamp(11px, 0.75vw, 14px)',
            height: 'clamp(11px, 0.75vw, 14px)',
            stroke: '#10B981',
            strokeWidth: '2.8',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        bulletText: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(15px, 0.95vw, 18px)',
            lineHeight: '24px',
            fontWeight: '500',
            color: '#334155',
        },
        matchingCtaButton: {
            backgroundColor: isMatchingCtaHovered ? 'rgba(67, 56, 202, 1)' : '#4F46E5',
            color: '#FFFFFF',
            fontSize: 'clamp(14.5px, 0.95vw, 16px)',
            fontWeight: '700',
            height: 'clamp(44px, 2.8vw, 48px)',
            padding: 'clamp(10px, 0.8vw, 12px) clamp(22px, 1.6vw, 28px)',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            textDecoration: 'none',
            boxShadow: isMatchingCtaHovered
                ? '0 8px 25px -4px rgba(79, 70, 229, 0.5)'
                : '0 4px 14px 0 rgba(79, 70, 229, 0.35)',
            transform: isMatchingCtaHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.25s ease',
        },
        matchingArrowIcon: {
            width: '18px',
            height: '18px',
            strokeWidth: '2.4',
            stroke: 'currentColor',
            fill: 'none',
            display: 'inline-block',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isMatchingCtaHovered ? 'translateX(3px)' : 'none',
        },

        // Resume Intelligence Section
        resumeSection: {
            width: '100%',
            backgroundColor: '#FFFFFF',
            paddingTop: 'clamp(60px, 5.5vw, 110px)',
            paddingBottom: 'clamp(60px, 5.5vw, 110px)',
            paddingLeft: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            paddingRight: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #F1F5F9',
        },
        resumeContainer: {
            width: '100%',
            maxWidth: 'clamp(1400px, 86vw, 1650px)',
            display: 'grid',
            gridTemplateColumns: isMobile || isTablet ? '1fr' : 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
            gap: 'clamp(48px, 4.5vw, 90px)',
            alignItems: isMobile || isTablet ? 'start' : 'center',
            boxSizing: 'border-box',
        },
        // Left Content
        resumeContent: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            textAlign: 'left',
            width: '100%',
            maxWidth: '650px',
            boxSizing: 'border-box',
            paddingTop: isDesktop ? '2px' : '0px',
            paddingBottom: isDesktop ? '2px' : '0px',
        },
        resumeBadge: {
            backgroundColor: '#FAF5FF',
            border: '1px solid #E9D5FF',
            borderRadius: '9999px',
            padding: '5px 14px',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(12px, 0.78vw, 14px)',
            lineHeight: '16px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#7E22CE',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(12px, 1vw, 16px)',
        },
        resumeHeading: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(36px, 3.2vw, 56px)',
            fontWeight: '800',
            lineHeight: '1.1',
            letterSpacing: '-1.5px',
            color: '#0F172A',
            margin: '0 0 clamp(12px, 1vw, 18px) 0',
        },
        resumeDescription: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(16px, 1vw, 18px)',
            lineHeight: 'clamp(24px, 1.6vw, 28px)',
            fontWeight: '400',
            color: '#475569',
            margin: '0 0 clamp(18px, 1.5vw, 26px) 0',
            maxWidth: '650px',
        },
        resumeBulletsList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(12px, 1vw, 16px)',
            width: '100%',
            marginBottom: 'clamp(22px, 1.8vw, 28px)',
        },
        resumeBulletItem: {
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(10px, 0.8vw, 14px)',
        },
        resumeBulletIcon: {
            width: 'clamp(20px, 1.3vw, 24px)',
            height: 'clamp(20px, 1.3vw, 24px)',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        resumeBulletIconSvg: {
            width: 'clamp(11px, 0.75vw, 14px)',
            height: 'clamp(11px, 0.75vw, 14px)',
            stroke: '#FFFFFF',
            strokeWidth: '3',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        resumeBulletText: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(15px, 0.95vw, 18px)',
            lineHeight: '24px',
            fontWeight: '500',
            color: '#334155',
        },
        resumeCtaButton: {
            backgroundColor: isResumeCtaHovered ? 'rgba(67, 56, 202, 1)' : '#4F46E5',
            color: '#FFFFFF',
            fontSize: 'clamp(14.5px, 0.95vw, 16px)',
            fontWeight: '700',
            height: 'clamp(44px, 2.8vw, 48px)',
            padding: 'clamp(10px, 0.8vw, 12px) clamp(22px, 1.6vw, 28px)',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textDecoration: 'none',
            boxShadow: isResumeCtaHovered
                ? '0 8px 25px -4px rgba(79, 70, 229, 0.5)'
                : '0px 1px 2px rgba(0, 0, 0, 0.05)',
            transform: isResumeCtaHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.25s ease',
        },
        resumeArrowIcon: {
            width: '18px',
            height: '18px',
            strokeWidth: '2.4',
            stroke: 'currentColor',
            fill: 'none',
            display: 'inline-block',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isResumeCtaHovered ? 'translateX(3px)' : 'none',
        },

        // Right Graphics Card - Resume Comparison Visual
        outerComparisonCard: {
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: 'clamp(20px, 1.5vw, 24px)',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: 'clamp(600px, 42vw, 720px)',
            display: 'flex',
            flexDirection: 'column',
            alignSelf: 'center',
            justifySelf: isMobile || isTablet ? 'stretch' : 'center',
            boxShadow: '0px 6px 20px rgba(15, 23, 42, 0.04)',
        },
        innerComparisonGrid: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 'clamp(12px, 1.1vw, 20px)',
            width: '100%',
            position: 'relative',
            alignItems: 'stretch',
        },
        transformationArrowBadge: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'clamp(28px, 1.8vw, 34px)',
            height: 'clamp(28px, 1.8vw, 34px)',
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #D8B4FE',
            boxShadow: '0 2px 8px rgba(126, 34, 206, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            color: '#7E22CE',
        },
        transformationArrowIcon: {
            width: 'clamp(13px, 0.9vw, 16px)',
            height: 'clamp(13px, 0.9vw, 16px)',
            strokeWidth: '2.5',
            stroke: '#7E22CE',
            fill: 'none',
        },
        baseResumeCard: {
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0px 2px 8px rgba(15, 23, 42, 0.04)',
            borderRadius: '16px',
            padding: 'clamp(16px, 1.2vw, 20px)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
        },
        tailoredResumeCard: {
            backgroundColor: '#FFFFFF',
            border: '2px solid #D8B4FE',
            boxShadow: '0px 4px 16px rgba(168, 85, 247, 0.1)',
            borderRadius: '16px',
            padding: 'clamp(16px, 1.2vw, 20px)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
        },
        baseCardHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F5F9',
            paddingBottom: 'clamp(8px, 0.6vw, 10px)',
            marginBottom: 'clamp(10px, 0.7vw, 12px)',
        },
        tailoredCardHeader: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F3E8FF',
            paddingBottom: 'clamp(8px, 0.6vw, 10px)',
            marginBottom: 'clamp(10px, 0.7vw, 12px)',
        },
        baseCardTitle: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(12px, 0.85vw, 14px)',
            lineHeight: '18px',
            color: '#334155',
            margin: 0,
        },
        baseCardSubtitle: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '500',
            fontSize: 'clamp(10.5px, 0.72vw, 12px)',
            lineHeight: '16px',
            color: '#94A3B8',
        },
        tailoredCardTitle: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(12px, 0.85vw, 14px)',
            lineHeight: '18px',
            color: '#581C87',
            margin: 0,
        },
        tailoredAtsBadge: {
            backgroundColor: '#D1FAE5',
            color: '#047857',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(10.5px, 0.72vw, 12px)',
            padding: '2px 8px',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            lineHeight: '16px',
        },
        roleTitle: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '600',
            fontSize: 'clamp(13px, 0.9vw, 15px)',
            lineHeight: '20px',
            color: '#0F172A',
            margin: '0 0 clamp(8px, 0.6vw, 10px) 0',
        },
        placeholderBar1: {
            width: '100%',
            height: '6px',
            backgroundColor: '#F1F5F9',
            borderRadius: '9999px',
            marginBottom: '6px',
        },
        placeholderBar2: {
            width: '65%',
            height: '6px',
            backgroundColor: '#F1F5F9',
            borderRadius: '9999px',
            marginBottom: 'clamp(10px, 0.8vw, 14px)',
        },
        tailoredPlaceholderBar1: {
            width: '100%',
            height: '6px',
            backgroundColor: '#F3E8FF',
            borderRadius: '9999px',
            marginBottom: '6px',
        },
        tailoredPlaceholderBar2: {
            width: '70%',
            height: '6px',
            backgroundColor: '#F3E8FF',
            borderRadius: '9999px',
            marginBottom: 'clamp(10px, 0.8vw, 14px)',
        },
        tagsContainer: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(5px, 0.4vw, 8px)',
        },
        baseTag: {
            backgroundColor: '#F1F5F9',
            color: '#475569',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(11px, 0.75vw, 12.5px)',
            fontWeight: '500',
            padding: '3px 9px',
            borderRadius: '6px',
            lineHeight: '16px',
            border: '1px solid #E2E8F0',
        },
        tailoredTag: {
            backgroundColor: '#FAF5FF',
            color: '#7E22CE',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(11px, 0.75vw, 12.5px)',
            fontWeight: '600',
            padding: '3px 9px',
            borderRadius: '6px',
            lineHeight: '16px',
            border: '1px solid #F3E8FF',
        },
        bottomMessageDivider: {
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            marginTop: 'clamp(14px, 1vw, 18px)',
            paddingTop: 'clamp(10px, 0.8vw, 14px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
        },
        bottomMessageText: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '600',
            fontSize: 'clamp(13px, 0.85vw, 14.5px)',
            lineHeight: '20px',
            color: '#7E22CE',
            textAlign: 'center',
        },

        // Application Automation Section
        automationSection: {
            width: '100%',
            backgroundColor: '#FFFFFF',
            paddingTop: 'clamp(60px, 5.5vw, 110px)',
            paddingBottom: 'clamp(60px, 5.5vw, 110px)',
            paddingLeft: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            paddingRight: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #F1F5F9',
        },
        automationContainer: {
            width: '100%',
            maxWidth: 'clamp(1400px, 86vw, 1650px)',
            display: 'grid',
            gridTemplateColumns: isMobile || isTablet ? '1fr' : 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
            gap: 'clamp(48px, 4.5vw, 90px)',
            alignItems: isMobile || isTablet ? 'start' : 'stretch',
            boxSizing: 'border-box',
        },
        // Left: Application Automation Status Card
        automationCard: {
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: 'clamp(24px, 2vw, 34px)',
            boxShadow: '0px 8px 24px rgba(15, 23, 42, 0.05)',
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: 'clamp(660px, 48vw, 780px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
        },
        automationCardHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: 'clamp(10px, 0.8vw, 14px)',
        },
        brandBadgeSquare: {
            width: 'clamp(28px, 1.8vw, 34px)',
            height: 'clamp(28px, 1.8vw, 34px)',
            borderRadius: '8px',
            backgroundColor: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '800',
            fontSize: 'clamp(14px, 1vw, 17px)',
            flexShrink: 0,
        },
        automationHeaderInfo: {
            display: 'flex',
            flexDirection: 'column',
        },
        automationCardCompany: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(14px, 0.95vw, 16px)',
            color: '#0F172A',
            lineHeight: '1.2',
        },
        automationCardAgentTag: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '600',
            fontSize: 'clamp(11.5px, 0.75vw, 13px)',
            color: '#6366F1',
            lineHeight: '1.2',
            marginTop: '2px',
        },
        automationJobTitle: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(18px, 1.25vw, 21px)',
            color: '#0F172A',
            margin: '0 0 clamp(16px, 1.2vw, 22px) 0',
        },
        automationStepsContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(8px, 0.65vw, 11px)',
            width: '100%',
        },
        statusRow: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'clamp(6px, 0.45vw, 8px) 0',
        },
        statusRowLeft: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
        },
        completedCheckIcon: {
            width: 'clamp(16px, 1.1vw, 18px)',
            height: 'clamp(16px, 1.1vw, 18px)',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        completedCheckSvg: {
            width: '10px',
            height: '10px',
            stroke: '#FFFFFF',
            strokeWidth: '3',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        stepTitleCompleted: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '600',
            fontSize: 'clamp(13.5px, 0.88vw, 15px)',
            color: '#0F172A',
        },
        statusBadgeCompleted: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '600',
            fontSize: 'clamp(11.5px, 0.75vw, 13px)',
            color: '#059669',
        },
        activeStepBox: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(238, 242, 255, 0.85)',
            border: '1px solid rgba(199, 210, 254, 0.9)',
            borderRadius: '12px',
            padding: 'clamp(8px, 0.6vw, 11px) clamp(12px, 0.9vw, 16px)',
            margin: '2px 0',
        },
        activeIndicatorDot: {
            width: 'clamp(10px, 0.7vw, 12px)',
            height: 'clamp(10px, 0.7vw, 12px)',
            borderRadius: '50%',
            backgroundColor: '#4F46E5',
            boxShadow: '0 0 0 3px rgba(199, 210, 254, 0.6)',
            flexShrink: 0,
        },
        stepTitleActive: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(13.5px, 0.88vw, 15px)',
            color: '#312E81',
        },
        statusBadgeActive: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '600',
            fontSize: 'clamp(11.5px, 0.75vw, 13px)',
            color: '#4F46E5',
        },
        pendingCircleIcon: {
            width: 'clamp(16px, 1.1vw, 18px)',
            height: 'clamp(16px, 1.1vw, 18px)',
            borderRadius: '50%',
            border: '1.5px solid #CBD5E1',
            backgroundColor: 'transparent',
            flexShrink: 0,
        },
        stepTitlePending: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '500',
            fontSize: 'clamp(13.5px, 0.88vw, 15px)',
            color: '#64748B',
        },
        statusBadgePending: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '500',
            fontSize: 'clamp(11.5px, 0.75vw, 13px)',
            color: '#94A3B8',
        },

        // Right Content
        automationContent: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            textAlign: 'left',
            width: '100%',
            maxWidth: '650px',
            height: '100%',
            boxSizing: 'border-box',
            paddingTop: isDesktop ? '2px' : '0px',
            paddingBottom: isDesktop ? '2px' : '0px',
        },
        automationBadge: {
            backgroundColor: '#FAF5FF',
            border: '1px solid #E9D5FF',
            borderRadius: '9999px',
            padding: '5px 14px',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(12px, 0.78vw, 14px)',
            lineHeight: '16px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#7E22CE',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(12px, 1vw, 16px)',
        },
        automationHeading: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(36px, 3.2vw, 56px)',
            fontWeight: '800',
            lineHeight: '1.1',
            letterSpacing: '-1.5px',
            color: '#0F172A',
            margin: '0 0 clamp(12px, 1vw, 18px) 0',
        },
        automationDescription: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(16px, 1vw, 18px)',
            lineHeight: 'clamp(24px, 1.6vw, 28px)',
            fontWeight: '400',
            color: '#475569',
            margin: '0 0 clamp(18px, 1.5vw, 26px) 0',
            maxWidth: '650px',
        },
        automationBulletsList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(12px, 1vw, 16px)',
            width: '100%',
            marginBottom: 'clamp(22px, 1.8vw, 28px)',
        },
        automationBulletItem: {
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(10px, 0.8vw, 14px)',
        },
        automationBulletIcon: {
            width: 'clamp(20px, 1.3vw, 24px)',
            height: 'clamp(20px, 1.3vw, 24px)',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        automationBulletIconSvg: {
            width: '11px',
            height: '11px',
            stroke: '#FFFFFF',
            strokeWidth: '3',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        automationBulletText: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(15px, 0.95vw, 18px)',
            lineHeight: '24px',
            fontWeight: '500',
            color: '#334155',
        },
        automationCtaButton: {
            backgroundColor: isAutomationCtaHovered ? 'rgba(67, 56, 202, 1)' : '#4F46E5',
            color: '#FFFFFF',
            fontSize: 'clamp(14.5px, 0.95vw, 16px)',
            fontWeight: '700',
            height: 'clamp(44px, 2.8vw, 48px)',
            padding: 'clamp(10px, 0.8vw, 12px) clamp(22px, 1.6vw, 28px)',
            borderRadius: '9999px',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textDecoration: 'none',
            boxShadow: isAutomationCtaHovered
                ? '0 8px 25px -4px rgba(79, 70, 229, 0.5)'
                : '0px 1px 2px rgba(0, 0, 0, 0.05)',
            transform: isAutomationCtaHovered ? 'translateY(-2px)' : 'none',
            transition: 'all 0.25s ease',
        },
        automationArrowIcon: {
            width: '18px',
            height: '18px',
            strokeWidth: '2.4',
            stroke: 'currentColor',
            fill: 'none',
            display: 'inline-block',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: isAutomationCtaHovered ? 'translateX(3px)' : 'none',
        },

        // Pricing Section
        pricingSection: {
            width: '100%',
            backgroundColor: '#FFFFFF',
            paddingTop: 'clamp(60px, 5.5vw, 110px)',
            paddingBottom: 'clamp(60px, 5.5vw, 110px)',
            paddingLeft: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            paddingRight: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #F1F5F9',
        },
        pricingContainer: {
            width: '100%',
            maxWidth: 'clamp(1000px, 72vw, 1320px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
        },
        pricingBadge: {
            backgroundColor: '#FAF5FF',
            border: '1px solid #E9D5FF',
            borderRadius: '9999px',
            padding: '5px 14px',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(12px, 0.78vw, 14px)',
            lineHeight: '16px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#7E22CE',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(16px, 1.2vw, 24px)',
        },
        pricingHeading: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(36px, 3.2vw, 54px)',
            fontWeight: '800',
            lineHeight: '1.12',
            letterSpacing: '-1.5px',
            color: '#0F172A',
            margin: '0 0 clamp(12px, 1vw, 16px) 0',
            textAlign: 'center',
        },
        pricingDescription: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(16px, 1vw, 18px)',
            lineHeight: 'clamp(24px, 1.6vw, 28px)',
            fontWeight: '400',
            color: '#475569',
            margin: '0 0 clamp(48px, 4vw, 72px) 0',
            maxWidth: '700px',
            textAlign: 'center',
        },
        pricingCardsGrid: {
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 'clamp(20px, 1.8vw, 32px)',
            width: '100%',
            maxWidth: 'clamp(920px, 66vw, 1220px)',
            alignItems: 'stretch',
        },
        basicPricingCard: {
            backgroundColor: '#FFFFFF',
            border: isBasicCardHovered ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
            borderRadius: '24px',
            padding: 'clamp(28px, 2.2vw, 40px)',
            boxShadow: isBasicCardHovered
                ? '0 20px 35px -5px rgba(79, 70, 229, 0.16), 0 10px 15px -5px rgba(79, 70, 229, 0.08)'
                : '0px 2px 4px -2px rgba(79, 70, 229, 0.12), 0px 4px 6px -1px rgba(79, 70, 229, 0.12)',
            transform: isBasicCardHovered ? 'translateY(-6px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            position: 'relative',
        },
        proPricingCard: {
            backgroundColor: '#FFFFFF',
            border: isProCardHovered ? '2px solid #6366F1' : '2px solid #818CF8',
            borderRadius: '24px',
            padding: 'clamp(28px, 2.2vw, 40px)',
            boxShadow: isProCardHovered
                ? '0 25px 40px -5px rgba(79, 70, 229, 0.35), 0 12px 20px -5px rgba(79, 70, 229, 0.18)'
                : '0px 2px 4px -2px rgba(79, 70, 229, 0.3), 0px 4px 6px -1px rgba(79, 70, 229, 0.3)',
            transform: isProCardHovered ? 'translateY(-6px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            position: 'relative',
        },
        popularBadge: {
            position: 'absolute',
            top: '-16px',
            right: 'clamp(24px, 2vw, 36px)',
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(11.5px, 0.75vw, 13px)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '6px 18px',
            borderRadius: '9999px',
            boxShadow: '0px 2px 6px rgba(79, 70, 229, 0.4)',
            zIndex: 2,
        },
        planTitle: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(20px, 1.4vw, 24px)',
            lineHeight: '1.2',
            color: '#0F172A',
            margin: '0 0 clamp(12px, 1vw, 16px) 0',
        },
        priceRow: {
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            margin: '0 0 clamp(8px, 0.6vw, 12px) 0',
        },
        priceAmount: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(40px, 3vw, 54px)',
            fontWeight: '800',
            lineHeight: '1',
            letterSpacing: '-1px',
            color: '#0F172A',
        },
        pricePeriod: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(15px, 0.95vw, 18px)',
            fontWeight: '400',
            color: '#64748B',
        },
        planLimit: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(14px, 0.88vw, 16px)',
            fontWeight: '600',
            color: '#4F46E5',
            margin: 0,
        },
        pricingDivider: {
            borderTop: '1px solid #E2E8F0',
            marginTop: 'clamp(24px, 1.8vw, 32px)',
            marginBottom: 'clamp(20px, 1.5vw, 28px)',
            width: '100%',
        },
        pricingFeaturesList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(14px, 1.1vw, 18px)',
            flexGrow: 1,
            marginBottom: 'clamp(28px, 2.2vw, 36px)',
            width: '100%',
        },
        pricingFeatureItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        pricingCheckIcon: {
            width: 'clamp(18px, 1.2vw, 22px)',
            height: 'clamp(18px, 1.2vw, 22px)',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        },
        pricingCheckSvg: {
            width: 'clamp(10px, 0.7vw, 12px)',
            height: 'clamp(10px, 0.7vw, 12px)',
            stroke: '#FFFFFF',
            strokeWidth: '3',
            fill: 'none',
            strokeLinecap: 'round',
            strokeLinejoin: 'round',
        },
        pricingFeatureText: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(15px, 0.95vw, 17px)',
            fontWeight: '500',
            color: '#334155',
            lineHeight: '22px',
        },
        basicCtaButton: {
            width: '100%',
            height: 'clamp(48px, 3.2vw, 56px)',
            borderRadius: '12px',
            fontSize: 'clamp(15px, 0.95vw, 17px)',
            fontWeight: '700',
            color: '#FFFFFF',
            background: 'linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isBasicCtaHovered
                ? '0 8px 25px -4px rgba(79, 70, 229, 0.5)'
                : '0px 2px 4px -2px rgba(79, 70, 229, 0.3), 0px 4px 6px -1px rgba(79, 70, 229, 0.3)',
            transform: isBasicCtaHovered ? 'translateY(-2px)' : 'none',
            filter: isBasicCtaHovered ? 'brightness(1.08)' : 'none',
            transition: 'all 0.25s ease',
            textDecoration: 'none',
        },
        proCtaButton: {
            width: '100%',
            height: 'clamp(48px, 3.2vw, 56px)',
            borderRadius: '12px',
            fontSize: 'clamp(15px, 0.95vw, 17px)',
            fontWeight: '700',
            color: '#FFFFFF',
            background: 'linear-gradient(90deg, #2563EB 0%, #4F46E5 100%)',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isProCtaHovered
                ? '0 8px 25px -4px rgba(79, 70, 229, 0.5)'
                : '0px 2px 4px -2px rgba(79, 70, 229, 0.3), 0px 4px 6px -1px rgba(79, 70, 229, 0.3)',
            transform: isProCtaHovered ? 'translateY(-2px)' : 'none',
            filter: isProCtaHovered ? 'brightness(1.08)' : 'none',
            transition: 'all 0.25s ease',
            textDecoration: 'none',
        },
        pricingArrowIcon: {
            width: '18px',
            height: '18px',
            strokeWidth: '2.4',
            stroke: 'currentColor',
            fill: 'none',
            display: 'inline-block',
            flexShrink: 0,
        },

        // FAQ Section
        faqSection: {
            width: '100%',
            backgroundColor: '#FFFFFF',
            paddingTop: 'clamp(60px, 5.5vw, 110px)',
            paddingBottom: 'clamp(80px, 7vw, 130px)',
            paddingLeft: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            paddingRight: isMobile ? '20px' : isTablet ? '32px' : 'clamp(40px, 4.5vw, 90px)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderTop: '1px solid #F1F5F9',
        },
        faqContainer: {
            width: '100%',
            maxWidth: 'clamp(920px, 66vw, 1220px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxSizing: 'border-box',
        },
        faqBadge: {
            backgroundColor: '#EEF2FF',
            border: '1px solid #E0E7FF',
            borderRadius: '9999px',
            padding: '6px 16px',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(12px, 0.78vw, 14px)',
            lineHeight: '16px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#4F46E5',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'clamp(16px, 1.2vw, 24px)',
        },
        faqHeading: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(36px, 2.8vw, 52px)',
            fontWeight: '800',
            lineHeight: '1.12',
            letterSpacing: '-1.5px',
            color: '#0F172A',
            margin: '0 0 clamp(12px, 1vw, 16px) 0',
            textAlign: 'center',
        },
        faqDescription: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(16px, 1vw, 18px)',
            lineHeight: 'clamp(24px, 1.6vw, 28px)',
            fontWeight: '400',
            color: '#475569',
            margin: '0 0 clamp(48px, 3.8vw, 68px) 0',
            maxWidth: '700px',
            textAlign: 'center',
        },
        faqAccordionList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(12px, 1vw, 16px)',
            width: '100%',
        },
        faqItem: {
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            boxShadow: '0px 2px 6px rgba(15, 23, 42, 0.03)',
            overflow: 'hidden',
            width: '100%',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        },
        faqQuestionButton: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'clamp(20px, 1.5vw, 26px) clamp(22px, 1.8vw, 32px)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
            outline: 'none',
            gap: '16px',
        },
        faqQuestionText: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(16px, 1.05vw, 18px)',
            lineHeight: '26px',
            color: '#0F172A',
            flex: 1,
        },
        faqExpandIcon: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(20px, 1.3vw, 24px)',
            fontWeight: '500',
            color: '#64748B',
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            userSelect: 'none',
            width: '24px',
            height: '24px',
        },
        faqAnswerWrapper: {
            padding: '0 clamp(22px, 1.8vw, 32px) clamp(22px, 1.6vw, 28px) clamp(22px, 1.8vw, 32px)',
            marginTop: '-4px',
        },
        faqAnswerText: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '400',
            fontSize: 'clamp(15px, 0.95vw, 16.5px)',
            lineHeight: 'clamp(24px, 1.6vw, 28px)',
            color: '#475569',
            margin: 0,
            maxWidth: '1100px',
            textAlign: 'left',
        },
    };

    return (
        <div style={styles.container}>
            {/* NAVBAR */}
            <Navbar />

            {/* HERO SECTION */}
            <section style={styles.heroSection} aria-label="Hero Section">
                {/* Floating Decorative Image Cards */}
                <img
                    src={image2044}
                    alt=""
                    role="presentation"
                    style={styles.topLeftCard}
                />
                <img
                    src={image2045}
                    alt=""
                    role="presentation"
                    style={styles.topRightCard}
                />
                <img
                    src={image2046}
                    alt=""
                    role="presentation"
                    style={styles.bottomLeftCard}
                />
                <img
                    src={image2047}
                    alt=""
                    role="presentation"
                    style={styles.bottomRightCard}
                />

                {/* Central Content */}
                <div style={styles.contentWrapper}>
                    {/* Main Heading */}
                    <h1 style={styles.heading}>
                        Find the right jobs.
                        <br />
                        Let AI handle the
                        <br />
                        <span style={styles.headingGradient}>application.</span>
                    </h1>

                    {/* Description */}
                    <p style={styles.description}>
                        Discover relevant opportunities, understand your match, create job-specific
                        resumes, and automate applications — all from one platform.
                    </p>

                    {/* CTA Button */}
                    <button
                        type="button"
                        style={styles.ctaButton}
                        onMouseEnter={() => setIsCtaHovered(true)}
                        onMouseLeave={() => setIsCtaHovered(false)}
                    >
                        <span>Start Applying Smarter</span>
                        <svg
                            style={styles.arrowIcon}
                            viewBox="0 0 24 24"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Feature Row */}
                    <div style={styles.featureRow}>
                        {features.map((feature, index) => (
                            <div key={index} style={styles.featureItem}>
                                <svg
                                    style={styles.checkIcon}
                                    viewBox="0 0 24 24"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M8 12l2.5 2.5L16 9" />
                                </svg>
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* TRUSTED BY SECTION */}
            <section style={styles.trustedSection} aria-label="Trusted By Section">
                <h2 style={styles.trustedHeading}>TRUSTED BY JOB SEEKERS WORLDWIDE</h2>

                <div style={styles.logoRow}>
                    {/* 1. Google */}
                    <div style={styles.logoWrapper} title="Google">
                        <img src={googleLogo} alt="Google" style={styles.logoGoogle} />
                    </div>

                    {/* 2. Microsoft */}
                    <div style={styles.logoWrapper} title="Microsoft">
                        <img src={microsoftLogo} alt="Microsoft" style={styles.logoMicrosoft} />
                    </div>

                    {/* 3. Adobe */}
                    <div style={styles.logoWrapper} title="Adobe">
                        <img src={adobeLogo} alt="Adobe" style={styles.logoAdobe} />
                    </div>

                    {/* 4. Amazon */}
                    <div style={styles.logoWrapper} title="Amazon">
                        <img src={amazonLogo} alt="Amazon" style={styles.logoAmazon} />
                    </div>

                    {/* 5. Deloitte */}
                    <div style={styles.logoWrapper} title="Deloitte">
                        <img src={deloitteLogo} alt="Deloitte" style={styles.logoDeloitte} />
                    </div>

                    {/* 6. IBM */}
                    <div style={styles.logoWrapper} title="IBM">
                        <img src={ibmLogo} alt="IBM" style={styles.logoIbm} />
                    </div>

                    {/* 7. Meta */}
                    <div style={styles.logoWrapper} title="Meta">
                        <img src={metaLogo} alt="Meta" style={styles.logoMeta} />
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS SECTION */}
            <section id="how-it-works" style={styles.howItWorksSection} aria-label="How It Works Section">
                {/* Section Label */}
                <p style={styles.howItWorksLabel}>HOW IT WORKS</p>

                {/* Main Heading */}
                <h2 style={styles.howItWorksHeading}>Your job search, automated.</h2>

                {/* Description */}
                <p style={styles.howItWorksDescription}>
                    From discovering opportunities to tracking your applications — we handle the
                    repetitive work, so you can focus on your career.
                </p>

                {/* 5 Feature Columns */}
                <div style={styles.stepsContainer}>
                    {howItWorksSteps.map((stepItem, index) => (
                        <div key={index} style={styles.stepCard}>
                            {/* Rounded Square Icon Container */}
                            <div style={styles.iconBox}>
                                {stepItem.isCustomTrack ? (
                                    <svg
                                        width="22"
                                        height="22"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M3 3v18h18"
                                            stroke="#4F46E5"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                        <path
                                            d="M7 16l4-5 4 3 6-7"
                                            stroke="#4F46E5"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                ) : (
                                    <img
                                        src={stepItem.icon}
                                        alt={stepItem.step}
                                        style={styles.iconImg}
                                    />
                                )}
                            </div>

                            {/* Category Label */}
                            <span style={styles.stepCategory}>{stepItem.step}</span>

                            {/* Feature Title */}
                            <h3 style={styles.stepTitle}>{stepItem.title}</h3>

                            {/* Feature Description */}
                            <p style={styles.stepDescription}>{stepItem.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* INTELLIGENT MATCHING SECTION */}
            <section id="features" style={styles.matchingSection} aria-label="Intelligent Matching Section">
                <div style={styles.matchingContainer}>
                    {/* LEFT: ATS Match Breakdown Card */}
                    <div style={styles.atsCard}>
                        {/* Card Header */}
                        <div style={styles.atsCardHeader}>
                            <h3 style={styles.atsCardHeading}>ATS Match Breakdown</h3>
                            <div style={styles.activeEvalPill}>Active Evaluation</div>
                        </div>

                        {/* Card Body: Left 92% Circle + Right Progress Rows */}
                        <div style={styles.atsCardBody}>
                            {/* Score Ring Visual */}
                            <div style={styles.atsScoreContainer}>
                                <div style={styles.atsRingWrapper}>
                                    <svg
                                        viewBox="0 0 160 160"
                                        style={styles.atsRingSvg}
                                        aria-hidden="true"
                                    >
                                        {/* Background Track Circle */}
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="65"
                                            fill="none"
                                            stroke="#F1F5F9"
                                            strokeWidth="10"
                                        />
                                        {/* Progress Circle (92%) */}
                                        <circle
                                            cx="80"
                                            cy="80"
                                            r="65"
                                            fill="none"
                                            stroke="#10B981"
                                            strokeWidth="10"
                                            strokeLinecap="round"
                                            strokeDasharray="408.41"
                                            strokeDashoffset="32.67"
                                        />
                                    </svg>

                                    {/* Score Text in Center */}
                                    <div style={styles.atsScoreTextOverlay}>
                                        <span style={styles.atsScoreValue}>92%</span>
                                        <span style={styles.atsScoreLabel}>Excellent Match</span>
                                    </div>
                                </div>
                            </div>

                            {/* 6 Match Breakdown Rows */}
                            <div style={styles.breakdownRowsList}>
                                {matchBreakdownData.map((item, idx) => (
                                    <div key={idx} style={styles.breakdownRow}>
                                        <div style={styles.breakdownMeta}>
                                            <span style={styles.breakdownLabel}>{item.label}</span>
                                            <span style={styles.breakdownPercentage}>{item.percentage}%</span>
                                        </div>
                                        <div style={styles.progressBarTrack}>
                                            <div
                                                style={{
                                                    ...styles.progressBarFill,
                                                    width: `${item.percentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Intelligent Matching Content */}
                    <div style={styles.matchingContent}>
                        {/* Top Pill / Badge */}
                        <span style={styles.matchingBadge}>INTELLIGENT MATCHING</span>

                        {/* Main Heading (2 lines) */}
                        <h2 style={styles.matchingHeading}>
                            Don't apply blindly.
                            <br />
                            Know your match.
                        </h2>

                        {/* Description */}
                        <p style={styles.matchingDescription}>
                            Our internal ATS analyzes your profile, resume and the job description to give
                            you a clear match score with detailed insights.
                        </p>

                        {/* Bullet Points */}
                        <div style={styles.matchingBulletsList}>
                            {matchingBullets.map((bullet, idx) => (
                                <div key={idx} style={styles.matchingBulletItem}>
                                    <div style={styles.bulletCheckCircle}>
                                        <svg
                                            viewBox="0 0 24 24"
                                            style={styles.bulletCheckSvg}
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <span style={styles.bulletText}>{bullet}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <button
                            type="button"
                            style={styles.matchingCtaButton}
                            onMouseEnter={() => setIsMatchingCtaHovered(true)}
                            onMouseLeave={() => setIsMatchingCtaHovered(false)}
                        >
                            <span>See Matching in Action</span>
                            <svg
                                style={styles.matchingArrowIcon}
                                viewBox="0 0 24 24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* RESUME INTELLIGENCE SECTION */}
            <section id="resume-intelligence" style={styles.resumeSection} aria-label="Resume Intelligence Section">
                <div style={styles.resumeContainer}>
                    {/* LEFT: Resume Intelligence Content */}
                    <div style={styles.resumeContent}>
                        {/* Badge */}
                        <span style={styles.resumeBadge}>RESUME INTELLIGENCE</span>

                        {/* Heading (2 lines) */}
                        <h2 style={styles.resumeHeading}>
                            One resume isn’t enough
                            <br />
                            for every job.
                        </h2>

                        {/* Description */}
                        <p style={styles.resumeDescription}>
                            AutoApply analyzes the exact phrasing used in the employer's ATS and
                            reorganizes your genuine experiences to highlight precisely what hiring
                            managers are searching for.
                        </p>

                        {/* Bullet Points */}
                        <div style={styles.resumeBulletsList}>
                            {resumeBullets.map((bullet, idx) => (
                                <div key={idx} style={styles.resumeBulletItem}>
                                    <div style={styles.resumeBulletIcon}>
                                        <svg
                                            viewBox="0 0 24 24"
                                            style={styles.resumeBulletIconSvg}
                                        >
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <span style={styles.resumeBulletText}>{bullet}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <button
                            type="button"
                            style={styles.resumeCtaButton}
                            onMouseEnter={() => setIsResumeCtaHovered(true)}
                            onMouseLeave={() => setIsResumeCtaHovered(false)}
                        >
                            <span>Explore Resume Intelligence</span>
                            <svg
                                style={styles.resumeArrowIcon}
                                viewBox="0 0 24 24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* RIGHT: Resume Comparison Graphic */}
                    <div style={styles.outerComparisonCard}>
                        {/* Inner 2 Cards Grid */}
                        <div style={styles.innerComparisonGrid}>
                            {/* Left Card: Base Resume Card */}
                            <div style={styles.baseResumeCard}>
                                <div>
                                    <div style={styles.baseCardHeader}>
                                        <span style={styles.baseCardTitle}>Your Resume</span>
                                        <span style={styles.baseCardSubtitle}>Base Master</span>
                                    </div>
                                    <div style={styles.roleTitle}>Product Designer</div>
                                    <div style={styles.placeholderBar1} />
                                    <div style={styles.placeholderBar2} />
                                </div>
                                <div style={styles.tagsContainer}>
                                    <span style={styles.baseTag}>UX Research</span>
                                    <span style={styles.baseTag}>Figma</span>
                                    <span style={styles.baseTag}>Design Systems</span>
                                    <span style={styles.baseTag}>SaaS</span>
                                </div>
                            </div>

                            {/* Center Transformation Indicator */}
                            {!isMobile && (
                                <div style={styles.transformationArrowBadge} aria-hidden="true">
                                    <svg
                                        style={styles.transformationArrowIcon}
                                        viewBox="0 0 24 24"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </div>
                            )}

                            {/* Right Card: Tailored Resume Card */}
                            <div style={styles.tailoredResumeCard}>
                                <div>
                                    <div style={styles.tailoredCardHeader}>
                                        <span style={styles.tailoredCardTitle}>Tailored Resume</span>
                                        <div style={styles.tailoredAtsBadge}>
                                            <span>✓</span>
                                            <span>ATS Ready</span>
                                        </div>
                                    </div>
                                    <div style={styles.roleTitle}>Senior Product Designer (Adobe)</div>
                                    <div style={styles.tailoredPlaceholderBar1} />
                                    <div style={styles.tailoredPlaceholderBar2} />
                                </div>
                                <div style={styles.tagsContainer}>
                                    <span style={styles.tailoredTag}>Design Systems (Scale)</span>
                                    <span style={styles.tailoredTag}>Figma Tokens</span>
                                    <span style={styles.tailoredTag}>Cross-team UX</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Message */}
                        <div style={styles.bottomMessageDivider}>
                            <span role="img" aria-label="sparkles" style={{ fontSize: '14px' }}>✨</span>
                            <span style={styles.bottomMessageText}>
                                Automatically aligned to job requirements in seconds
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* APPLICATION AUTOMATION SECTION */}
            <section id="automation" style={styles.automationSection} aria-label="Application Automation Section">
                <div style={styles.automationContainer}>
                    {/* LEFT: Application Automation Status Card */}
                    <div style={styles.automationCard}>
                        {/* Top: Header Info & Job Title */}
                        <div>
                            <div style={styles.automationCardHeader}>
                                <div style={styles.brandBadgeSquare}>A</div>
                                <div style={styles.automationHeaderInfo}>
                                    <span style={styles.automationCardCompany}>Applying to Adobe</span>
                                    <span style={styles.automationCardAgentTag}>Live Agent</span>
                                </div>
                            </div>
                            <h3 style={styles.automationJobTitle}>Senior Product Designer</h3>
                        </div>

                        {/* Middle: Progress / Status Steps */}
                        <div style={styles.automationStepsContainer}>
                            {/* Completed Steps (3) */}
                            {automationCompletedSteps.map((step, idx) => (
                                <div key={idx} style={styles.statusRow}>
                                    <div style={styles.statusRowLeft}>
                                        <div style={styles.completedCheckIcon}>
                                            <svg viewBox="0 0 24 24" style={styles.completedCheckSvg}>
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span style={styles.stepTitleCompleted}>{step.title}</span>
                                    </div>
                                    <span style={styles.statusBadgeCompleted}>{step.status}</span>
                                </div>
                            ))}

                            {/* Active Step */}
                            <div style={styles.activeStepBox}>
                                <div style={styles.statusRowLeft}>
                                    <div style={styles.activeIndicatorDot} />
                                    <span style={styles.stepTitleActive}>Opening application portal</span>
                                </div>
                                <span style={styles.statusBadgeActive}>In Progress...</span>
                            </div>

                            {/* Pending Steps (3) */}
                            {automationPendingSteps.map((step, idx) => (
                                <div key={idx} style={styles.statusRow}>
                                    <div style={styles.statusRowLeft}>
                                        <div style={styles.pendingCircleIcon} />
                                        <span style={styles.stepTitlePending}>{step.title}</span>
                                    </div>
                                    <span style={styles.statusBadgePending}>{step.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Application Automation Content */}
                    <div style={styles.automationContent}>
                        {/* Badge */}
                        <span style={styles.automationBadge}>APPLICATION AUTOMATION</span>

                        {/* Heading */}
                        <h2 style={styles.automationHeading}>From Apply to Submitted.</h2>

                        {/* Description */}
                        <p style={styles.automationDescription}>
                            Our Application Agent can navigate supported career websites and job
                            boards, fill application forms, upload your resume and submit the
                            application.
                        </p>

                        {/* Features */}
                        <div style={styles.automationBulletsList}>
                            {automationFeatures.map((feature, idx) => (
                                <div key={idx} style={styles.automationBulletItem}>
                                    <div style={styles.automationBulletIcon}>
                                        <svg viewBox="0 0 24 24" style={styles.automationBulletIconSvg}>
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                    <span style={styles.automationBulletText}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <button
                            type="button"
                            style={styles.automationCtaButton}
                            onMouseEnter={() => setIsAutomationCtaHovered(true)}
                            onMouseLeave={() => setIsAutomationCtaHovered(false)}
                        >
                            <span>See It in Action</span>
                            <svg
                                style={styles.automationArrowIcon}
                                viewBox="0 0 24 24"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </section>

            {/* PRICING SECTION */}
            <section id="pricing" style={styles.pricingSection} aria-label="Pricing Section">
                <div style={styles.pricingContainer}>
                    {/* Badge */}
                    <span style={styles.pricingBadge}>PRICING</span>

                    {/* Heading */}
                    <h2 style={styles.pricingHeading}>Simple and transparent pricing.</h2>

                    {/* Description */}
                    <p style={styles.pricingDescription}>
                        Choose a plan that fits your job search goals. No payment per individual application.
                    </p>

                    {/* Two Pricing Cards */}
                    <div style={styles.pricingCardsGrid}>
                        {/* BASIC PLAN CARD */}
                        <div
                            style={styles.basicPricingCard}
                            onMouseEnter={() => setIsBasicCardHovered(true)}
                            onMouseLeave={() => setIsBasicCardHovered(false)}
                        >
                            <h3 style={styles.planTitle}>Basic Plan</h3>

                            <div style={styles.priceRow}>
                                <span style={styles.priceAmount}>$4.99</span>
                                <span style={styles.pricePeriod}>/ month</span>
                            </div>

                            <p style={styles.planLimit}>Up to 250 applications</p>

                            <div style={styles.pricingDivider} />

                            <div style={styles.pricingFeaturesList}>
                                {pricingFeatures.map((feature, idx) => (
                                    <div key={idx} style={styles.pricingFeatureItem}>
                                        <div style={styles.pricingCheckIcon}>
                                            <svg viewBox="0 0 24 24" style={styles.pricingCheckSvg}>
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span style={styles.pricingFeatureText}>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                style={styles.basicCtaButton}
                                onMouseEnter={() => setIsBasicCtaHovered(true)}
                                onMouseLeave={() => setIsBasicCtaHovered(false)}
                            >
                                <span>Get Started</span>
                                <svg
                                    style={styles.pricingArrowIcon}
                                    viewBox="0 0 24 24"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        {/* PRO PLAN CARD */}
                        <div
                            style={styles.proPricingCard}
                            onMouseEnter={() => setIsProCardHovered(true)}
                            onMouseLeave={() => setIsProCardHovered(false)}
                        >
                            {/* Most Popular Badge */}
                            <span style={styles.popularBadge}>MOST POPULAR</span>

                            <h3 style={styles.planTitle}>Pro Plan</h3>

                            <div style={styles.priceRow}>
                                <span style={styles.priceAmount}>$12.99</span>
                                <span style={styles.pricePeriod}>/ quarter</span>
                            </div>

                            <p style={styles.planLimit}>Up to 1000 applications</p>

                            <div style={styles.pricingDivider} />

                            <div style={styles.pricingFeaturesList}>
                                {pricingFeatures.map((feature, idx) => (
                                    <div key={idx} style={styles.pricingFeatureItem}>
                                        <div style={styles.pricingCheckIcon}>
                                            <svg viewBox="0 0 24 24" style={styles.pricingCheckSvg}>
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span style={styles.pricingFeatureText}>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                style={styles.proCtaButton}
                                onMouseEnter={() => setIsProCtaHovered(true)}
                                onMouseLeave={() => setIsProCtaHovered(false)}
                            >
                                <span>Get Started</span>
                                <svg
                                    style={styles.pricingArrowIcon}
                                    viewBox="0 0 24 24"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section id="faq" style={styles.faqSection} aria-label="FAQ Section">
                <div style={styles.faqContainer}>
                    {/* Badge */}
                    <span style={styles.faqBadge}>FAQ</span>

                    {/* Heading */}
                    <h2 style={styles.faqHeading}>Frequently asked questions</h2>

                    {/* Description */}
                    <p style={styles.faqDescription}>
                        Everything you need to know about our intelligent matching, automated
                        application agent, and data safety.
                    </p>

                    {/* FAQ Accordion List */}
                    <div style={styles.faqAccordionList}>
                        {faqItems.map((item, idx) => {
                            const isOpen = openFaq === idx;
                            return (
                                <div key={idx} style={styles.faqItem}>
                                    <button
                                        type="button"
                                        style={styles.faqQuestionButton}
                                        onClick={() => toggleFaq(idx)}
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-answer-${idx}`}
                                    >
                                        <span style={styles.faqQuestionText}>{item.question}</span>
                                        <span style={styles.faqExpandIcon} aria-hidden="true">
                                            {isOpen ? '−' : '+'}
                                        </span>
                                    </button>
                                    {isOpen && (
                                        <div id={`faq-answer-${idx}`} style={styles.faqAnswerWrapper}>
                                            <p style={styles.faqAnswerText}>{item.answer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <Footer />
        </div>
    );
};

export default Home;
