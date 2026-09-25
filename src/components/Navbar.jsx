import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logoSrc from '../assets/Background.svg';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [hoveredLink, setHoveredLink] = useState(null);
  const [isLoginHovered, setIsLoginHovered] = useState(false);
  const [isGetStartedHovered, setIsGetStartedHovered] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024 && windowWidth < 1920;
  const isUltraWide = windowWidth >= 1920;

  const scrollToSection = (e, targetId) => {
    if (e && e.preventDefault) e.preventDefault();
    if (targetId === 'pricing') {
      navigate('/plan');
      return;
    }
    if (targetId === 'top' || !targetId) {
      if (location.pathname !== '/') {
        navigate('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
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

  const navLinks = [
    { name: 'How It Works', targetId: 'how-it-works' },
    { name: 'Features', targetId: 'features' },
    { name: 'Pricing', targetId: 'pricing' },
    { name: 'FAQ', targetId: 'faq' },
  ];

  // Inline styles
  const styles = {
    header: {
      position: 'relative',
      width: '100%',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #F1F5F9',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
      zIndex: 1000,
      opacity: 1,
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    },
    navContainer: {
      width: '100%',
      maxWidth: isUltraWide ? '1920px' : '1440px',
      margin: '0 auto',
      height: '80px',
      paddingLeft: isMobile ? '16px' : isTablet ? '32px' : isUltraWide ? '120px' : '80px',
      paddingRight: isMobile ? '16px' : isTablet ? '32px' : isUltraWide ? '120px' : '80px',
      opacity: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxSizing: 'border-box',
    },
    // Left: Brand
    brandWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      textDecoration: 'none',
      cursor: 'pointer',
      userSelect: 'none',
      flexShrink: 0,
      margin: 0,
      padding: 0,
    },
    logoImg: {
      width: '38px',
      height: '38px',
      display: 'block',
      flexShrink: 0,
      objectFit: 'contain',
      margin: 0,
      padding: 0,
    },
    brandText: {
      color: 'rgba(0, 75, 151, 1)',
      fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
      fontSize: isUltraWide ? '22px' : '20px',
      fontWeight: '700',
      letterSpacing: '-0.02em',
      lineHeight: '1',
      display: 'flex',
      alignItems: 'center',
      margin: 0,
      padding: 0,
      whiteSpace: 'nowrap',
    },
    // Center: Nav Links
    navLinksGroup: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: isTablet ? '20px' : isUltraWide ? '40px' : '32px',
      listStyle: 'none',
      margin: 0,
      padding: 0,
    },
    navLinkItem: {
      display: 'inline-flex',
    },
    navLink: (isHovered) => ({
      color: isHovered ? 'rgba(0, 75, 151, 1)' : 'rgba(30, 41, 59, 0.85)',
      fontSize: '15px',
      fontWeight: '500',
      textDecoration: 'none',
      padding: '8px 6px',
      transition: 'color 0.2s ease, transform 0.15s ease',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
    }),
    // Right: Action Buttons
    actionGroup: {
      display: 'flex',
      alignItems: 'center',
      gap: '32px',
    },
    loginBtn: (isHovered) => ({
      backgroundColor: 'transparent',
      color: isHovered ? 'rgba(95, 48, 205, 1)' : 'rgba(110, 60, 229, 1)',
      fontSize: '15px',
      fontWeight: '600',
      height: '42px',
      padding: '0 8px',
      marginRight: '4px',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'color 0.2s ease, opacity 0.2s ease',
      opacity: isHovered ? 0.8 : 1,
      textDecoration: 'none',
      whiteSpace: 'nowrap',
      boxSizing: 'border-box',
    }),
    getStartedBtn: (isHovered) => ({
      backgroundColor: isHovered ? 'rgba(29, 78, 216, 1)' : 'rgba(37, 99, 235, 1)',
      minWidth: '144px',
      height: '42px',
      gap: '8px',
      opacity: 1,
      paddingTop: '10px',
      paddingRight: '22px',
      paddingBottom: '10px',
      paddingLeft: '22px',
      borderRadius: '9999px',
      color: '#FFFFFF',
      fontSize: '15px',
      fontWeight: '600',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      transition: 'background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease',
      boxShadow: isHovered ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
      transform: isHovered ? 'translateY(-1px)' : 'none',
      textDecoration: 'none',
      boxSizing: 'border-box',
    }),
    arrowIcon: {
      width: '16px',
      height: '16px',
      strokeWidth: '2.2',
      stroke: 'currentColor',
      fill: 'none',
      display: 'inline-block',
      flexShrink: 0,
    },
    // Mobile hamburger button
    hamburgerBtn: {
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      padding: '8px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '5px',
      width: '40px',
      height: '40px',
      borderRadius: '6px',
    },
    hamburgerLine: {
      width: '22px',
      height: '2px',
      backgroundColor: 'rgba(30, 41, 59, 0.9)',
      borderRadius: '2px',
      transition: 'all 0.2s ease',
    },
    // Mobile menu dropdown
    mobileMenu: {
      display: isMobile && isMobileMenuOpen ? 'flex' : 'none',
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #F1F5F9',
      padding: '20px 24px 28px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      gap: '16px',
    },
    mobileNavLink: {
      color: 'rgba(30, 41, 59, 0.9)',
      fontSize: '16px',
      fontWeight: '500',
      textDecoration: 'none',
      padding: '10px 0',
      borderBottom: '1px solid #F8FAFC',
    },
    mobileActionGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginTop: '8px',
    },
    mobileLoginBtn: {
      backgroundColor: 'transparent',
      color: 'rgba(110, 60, 229, 1)',
      fontSize: '15px',
      fontWeight: '600',
      height: '40px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textDecoration: 'none',
      width: '100%',
    },
    mobileGetStartedBtn: {
      backgroundColor: 'rgba(37, 99, 235, 1)',
      color: '#FFFFFF',
      fontSize: '15px',
      fontWeight: '600',
      height: '44px',
      borderRadius: '9999px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      textDecoration: 'none',
      width: '100%',
    },
  };

  return (
    <header style={styles.header}>
      <div style={styles.navContainer}>
        {/* LEFT: Brand */}
        <a
          href="#"
          onClick={(e) => scrollToSection(e, 'top')}
          style={styles.brandWrapper}
          aria-label="Auto Jobs Apply Home"
        >
          <img src={logoSrc} alt="Auto Jobs Apply Logo" style={styles.logoImg} />
          <span style={styles.brandText}>Auto Jobs Apply</span>
        </a>

        {/* CENTER: Nav links for Desktop & Tablet */}
        {!isMobile && (
          <nav aria-label="Main Navigation">
            <ul style={styles.navLinksGroup}>
              {navLinks.map((link, index) => (
                <li key={index} style={styles.navLinkItem}>
                  <a
                    href="#"
                    onClick={(e) => scrollToSection(e, link.targetId)}
                    style={styles.navLink(hoveredLink === index)}
                    onMouseEnter={() => setHoveredLink(index)}
                    onMouseLeave={() => setHoveredLink(null)}
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* RIGHT: Actions for Desktop & Tablet */}
        {!isMobile && (
          <div style={styles.actionGroup}>
            <button
              type="button"
              style={styles.loginBtn(isLoginHovered)}
              onClick={() => navigate('/login')}
              onMouseEnter={() => setIsLoginHovered(true)}
              onMouseLeave={() => setIsLoginHovered(false)}
            >
              Log in
            </button>
            <button
              type="button"
              style={styles.getStartedBtn(isGetStartedHovered)}
              onClick={() => navigate('/register')}
              onMouseEnter={() => setIsGetStartedHovered(true)}
              onMouseLeave={() => setIsGetStartedHovered(false)}
            >
              <span>Get Started</span>
              <svg
                style={styles.arrowIcon}
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* MOBILE HAMBURGER BUTTON */}
        {isMobile && (
          <button
            type="button"
            style={styles.hamburgerBtn}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span
              style={{
                ...styles.hamburgerLine,
                transform: isMobileMenuOpen
                  ? 'rotate(45deg) translate(5px, 5px)'
                  : 'none',
              }}
            />
            <span
              style={{
                ...styles.hamburgerLine,
                opacity: isMobileMenuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                ...styles.hamburgerLine,
                transform: isMobileMenuOpen
                  ? 'rotate(-45deg) translate(5px, -5px)'
                  : 'none',
              }}
            />
          </button>
        )}
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobile && isMobileMenuOpen && (
        <nav style={styles.mobileMenu} aria-label="Mobile Navigation">
          {navLinks.map((link, index) => (
            <a
              key={index}
              href="#"
              style={styles.mobileNavLink}
              onClick={(e) => {
                scrollToSection(e, link.targetId);
                setIsMobileMenuOpen(false);
              }}
            >
              {link.name}
            </a>
          ))}
          <div style={styles.mobileActionGroup}>
            <button
              type="button"
              style={styles.mobileLoginBtn}
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/login');
              }}
            >
              Log in
            </button>
            <button
              type="button"
              style={styles.mobileGetStartedBtn}
              onClick={() => {
                setIsMobileMenuOpen(false);
                navigate('/register');
              }}
            >
              <span>Get Started</span>
              <svg
                style={styles.arrowIcon}
                viewBox="0 0 24 24"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
