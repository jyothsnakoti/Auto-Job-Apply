import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';

const Footer = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1440
    );
    const [hoveredLink, setHoveredLink] = useState(null);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    const isDesktop = windowWidth >= 1024;

    const scrollToSection = (e, targetId) => {
        if (e && e.preventDefault) e.preventDefault();
        if (targetId === 'top') {
            if (location.pathname !== '/') {
                navigate('/');
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } else if (targetId) {
            if (location.pathname !== '/') {
                navigate('/');
                setTimeout(() => {
                    const element = document.getElementById(targetId);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            } else {
                const element = document.getElementById(targetId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    };

    const platformLinks = [
        { name: 'Home', targetId: 'top' },
        { name: 'Pricing', targetId: 'pricing' },
        { name: 'FAQ', targetId: 'faq' },
    ];

    const companyLinks = [
        { name: 'Terms & Conditions', targetId: null },
        { name: 'Privacy Policy', targetId: null },
        { name: 'Disclaimer', targetId: null },
    ];

    const styles = {
        footer: {
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #F1F5F9',
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            boxSizing: 'border-box',
        },
        container: {
            width: '100%',
            maxWidth: '1600px',
            margin: '0 auto',
            paddingLeft: isMobile ? '20px' : isTablet ? '36px' : 'clamp(40px, 4.2vw, 80px)',
            paddingRight: isMobile ? '20px' : isTablet ? '36px' : 'clamp(40px, 4.2vw, 80px)',
            paddingTop: 'clamp(50px, 4.5vw, 70px)',
            paddingBottom: 'clamp(40px, 3.5vw, 55px)',
            boxSizing: 'border-box',
        },
        topGrid: {
            display: 'grid',
            gridTemplateColumns: isMobile
                ? '1fr'
                : isTablet
                ? '1fr 1fr'
                : '1.8fr 0.8fr 0.8fr',
            gap: isMobile ? '40px' : isTablet ? '40px' : 'clamp(32px, 3vw, 64px)',
            alignItems: 'start',
            marginBottom: 'clamp(48px, 4vw, 68px)',
        },
        brandColumn: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gridColumn: isTablet ? '1 / -1' : 'auto',
        },
        brandHeader: {
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(10px, 0.9vw, 14px)',
            textDecoration: 'none',
            marginBottom: 'clamp(14px, 1.2vw, 18px)',
        },
        logoImg: {
            width: 'clamp(38px, 2.6vw, 46px)',
            height: 'clamp(38px, 2.6vw, 46px)',
            objectFit: 'contain',
            display: 'block',
            flexShrink: 0,
        },
        brandTitle: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(22px, 1.7vw, 30px)',
            lineHeight: '1.2',
            color: '#00509F',
            letterSpacing: '-0.02em',
            margin: 0,
        },
        brandDescription: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '400',
            fontSize: 'clamp(14.5px, 0.95vw, 16.5px)',
            lineHeight: 'clamp(24px, 1.5vw, 26px)',
            color: '#64748B',
            maxWidth: 'clamp(380px, 32vw, 480px)',
            margin: 0,
        },
        columnTitle: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '700',
            fontSize: 'clamp(14px, 0.95vw, 16px)',
            lineHeight: '20px',
            letterSpacing: '0.5px',
            color: '#475569',
            textTransform: 'uppercase',
            margin: '0 0 clamp(18px, 1.4vw, 24px) 0',
        },
        linksList: {
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(14px, 1.1vw, 20px)',
            padding: 0,
            margin: 0,
            listStyle: 'none',
        },
        linkItem: {
            margin: 0,
            padding: 0,
        },
        navLink: (isHovered) => ({
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontSize: 'clamp(15px, 0.95vw, 17px)',
            fontWeight: '500',
            lineHeight: '24px',
            color: isHovered ? '#4F46E5' : '#0F172A',
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            display: 'inline-block',
        }),
        divider: {
            width: '100%',
            height: '1px',
            backgroundColor: '#E2E8F0',
            margin: '0 0 clamp(24px, 1.8vw, 32px) 0',
        },
        copyright: {
            fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
            fontWeight: '400',
            fontSize: 'clamp(13px, 0.85vw, 14px)',
            lineHeight: '20px',
            color: '#64748B',
            textAlign: 'center',
            margin: 0,
        },
    };

    return (
        <footer style={styles.footer} aria-label="Site Footer">
            <div style={styles.container}>
                {/* TOP 3-COLUMN FOOTER */}
                <div style={styles.topGrid}>
                    {/* Column 1: Brand & Description */}
                    <div style={styles.brandColumn}>
                        <a
                            href="#"
                            onClick={(e) => scrollToSection(e, 'top')}
                            style={styles.brandHeader}
                            aria-label="Auto Jobs Apply Homepage"
                        >
                            <img
                                src={logoSrc}
                                alt="Auto Jobs Apply Logo"
                                style={styles.logoImg}
                            />
                            <span style={styles.brandTitle}>Auto Jobs Apply</span>
                        </a>
                        <p style={styles.brandDescription}>
                            Discover relevant opportunities, understand your match, create job-specific
                            resumes, and automate applications — all from one platform.
                        </p>
                    </div>

                    {/* Column 2: Platform Links */}
                    <div>
                        <h3 style={styles.columnTitle}>PLATFORM</h3>
                        <ul style={styles.linksList}>
                            {platformLinks.map((link, idx) => (
                                <li key={idx} style={styles.linkItem}>
                                    <a
                                        href="#"
                                        onClick={(e) => scrollToSection(e, link.targetId)}
                                        style={styles.navLink(hoveredLink === `platform-${idx}`)}
                                        onMouseEnter={() => setHoveredLink(`platform-${idx}`)}
                                        onMouseLeave={() => setHoveredLink(null)}
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Company Links */}
                    <div>
                        <h3 style={styles.columnTitle}>COMPANY</h3>
                        <ul style={styles.linksList}>
                            {companyLinks.map((link, idx) => (
                                <li key={idx} style={styles.linkItem}>
                                    <a
                                        href="#"
                                        onClick={(e) => scrollToSection(e, link.targetId)}
                                        style={styles.navLink(hoveredLink === `company-${idx}`)}
                                        onMouseEnter={() => setHoveredLink(`company-${idx}`)}
                                        onMouseLeave={() => setHoveredLink(null)}
                                    >
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* HORIZONTAL DIVIDER */}
                <div style={styles.divider} role="separator" />

                {/* BOTTOM COPYRIGHT */}
                <p style={styles.copyright}>
                    © 2026 Auto Job Apply. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
