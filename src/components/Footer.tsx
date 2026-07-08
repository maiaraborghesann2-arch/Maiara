import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-row">
        <Link to="/" className="footer-mark" aria-label="Lyken Agency — Home" data-magnetic>
          <Logo size={30} monogramOnly />
        </Link>

        <p className="footer-tagline u-label">Branding · UI/UX · AI-Integrated Design</p>

        <nav className="footer-links" aria-label="Contact and social">
          <a href="mailto:hello@lyken.agency" data-magnetic>
            Email
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer" data-magnetic>
            Instagram
          </a>
          <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" data-magnetic>
            LinkedIn
          </a>
        </nav>
      </div>

      <p className="footer-copyright u-label">Lyken Agency © 2026</p>
    </footer>
  );
}
