import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { Logo } from './Logo';
import { LiquidText } from './LiquidText';
import './NavBar.css';

const LINKS = [
  { to: '/about', label: 'About' },
  { to: '/projects', label: 'Projects' },
  { to: '/insights', label: 'Insights' },
  { to: '/contact', label: 'Contact' },
];

function NavItem({ to, label }: { to: string; label: string }) {
  const underlineRef = useRef<HTMLSpanElement>(null);

  const drawIn = () => {
    const el = underlineRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { transformOrigin: 'left center' });
    gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, duration: 0.4, ease: 'power2.out' });
  };

  const drawOut = () => {
    const el = underlineRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.set(el, { transformOrigin: 'right center' });
    gsap.to(el, { scaleX: 0, duration: 0.3, ease: 'power2.in' });
  };

  return (
    <NavLink
      to={to}
      className="nav-link"
      data-magnetic
      onMouseEnter={drawIn}
      onMouseLeave={drawOut}
      onFocus={drawIn}
      onBlur={drawOut}
    >
      {({ isActive }) => (
        <>
          <span className="nav-dot" data-active={isActive} aria-hidden="true" />
          <LiquidText as="span" className="nav-link-text" intensity={0.3} radius={48}>
            {label}
          </LiquidText>
          <span ref={underlineRef} className="nav-underline" aria-hidden="true" />
        </>
      )}
    </NavLink>
  );
}

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > 60);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // close the overlay on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // overlay entrance: fade + staggered fade-up links
  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    if (!menuOpen || !overlay) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: 'power2.out' });
      gsap.fromTo(
        '.nav-overlay-link',
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 0.1 },
      );
    }, overlay);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      ctx.revert();
      document.documentElement.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuOpen]);

  const closeMenu = () => {
    const overlay = overlayRef.current;
    if (!overlay) {
      setMenuOpen(false);
      return;
    }
    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => setMenuOpen(false),
    });
  };

  return (
    <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <Link to="/" className="navbar-home" aria-label="Lyken Agency — Home" data-magnetic>
        <Logo size={28} monogramOnly />
      </Link>

      <nav className="navbar-links" aria-label="Primary">
        {LINKS.map((l) => (
          <NavItem key={l.to} {...l} />
        ))}
      </nav>

      <button
        className="navbar-burger"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        data-magnetic
        onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
      >
        <span />
        <span />
        <span />
      </button>

      {menuOpen &&
        createPortal(
          <div ref={overlayRef} className="nav-overlay" role="dialog" aria-label="Menu">
            <button className="nav-overlay-close u-label" onClick={closeMenu}>
              Close
            </button>
            <nav className="nav-overlay-links" aria-label="Primary mobile">
              {LINKS.map((l) => (
                <NavLink key={l.to} to={l.to} className="nav-overlay-link" onClick={closeMenu}>
                  {({ isActive }) => (
                    <>
                      <span className="nav-dot" data-active={isActive} aria-hidden="true" />
                      {l.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>,
          document.body,
        )}
    </header>
  );
}
