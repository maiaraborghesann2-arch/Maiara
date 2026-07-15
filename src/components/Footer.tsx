import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useLang } from '../i18n/LanguageContext';
import './Footer.css';

export function Footer() {
  const { dict } = useLang();
  return (
    <footer className="footer">
      <div className="footer-row">
        <Link to="/" className="footer-mark" aria-label={dict.nav.home} data-magnetic>
          <Logo size={30} monogramOnly />
        </Link>

        <p className="footer-tagline u-label">{dict.footer.tagline}</p>

        <nav className="footer-links" aria-label={dict.footer.ariaLabel}>
          <a href="mailto:hello@lyken.agency" data-magnetic>
            {dict.footer.email}
          </a>
          <a href="https://www.instagram.com" target="_blank" rel="noreferrer" data-magnetic>
            Instagram
          </a>
          <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" data-magnetic>
            LinkedIn
          </a>
        </nav>
      </div>

      <p className="footer-copyright u-label">{dict.footer.copyright}</p>
    </footer>
  );
}
