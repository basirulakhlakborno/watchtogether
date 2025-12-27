import { HiShieldCheck, HiDocumentText, HiMail } from 'react-icons/hi';
import { FaFacebook, FaInstagram, FaGithub } from 'react-icons/fa';
import './Footer.less';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo-wrapper">
              <svg 
                className="footer-logo-icon" 
                xmlns="http://www.w3.org/2000/svg" 
                aria-label="Arch Linux" 
                role="img" 
                viewBox="0 0 512 512"
              >
                <rect width="512" height="512" rx="15%" className="arch-bg"></rect>
                <path d="M256 72c-14 35-23 57-39 91 10 11 22 23 41 36-21-8-35-17-45-26-21 43-53 103-117 220 50-30 90-48 127-55-2-7-3-14-3-22v-1c1-33 18-58 38-56 20 1 36 29 35 62l-2 17c36 7 75 26 125 54l-27-50c-13-10-27-23-55-38 19 5 33 11 44 17-86-159-93-180-122-250z" className="arch-path"></path>
              </svg>
              <h3 className="footer-title">SynsEvo</h3>
            </div>
            <p className="footer-description">
              Watch videos synchronously with friends and family
            </p>
            <div className="footer-social">
              <a 
                href="https://facebook.com/BorNoBXE" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link" 
                aria-label="Facebook"
              >
                <FaFacebook />
              </a>
              <a 
                href="https://instagram.com/bornosixninez" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link" 
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a 
                href="https://github.com/basirulakhlakborno" 
                target="_blank" 
                rel="noopener noreferrer"
                className="social-link" 
                aria-label="GitHub"
              >
                <FaGithub />
              </a>
            </div>
          </div>
          <div className="footer-links">
            <a href="#" className="footer-link">
              <HiShieldCheck className="footer-icon" />
              <span>Privacy</span>
            </a>
            <a href="#" className="footer-link">
              <HiDocumentText className="footer-icon" />
              <span>Terms</span>
            </a>
            <a 
              href="mailto:basirulakhlak@gmail.com" 
              className="footer-link"
            >
              <HiMail className="footer-icon" />
              <span>Contact</span>
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-text">
            © {new Date().getFullYear()} WatchTogether. Made with ❤️ by{' '}
            <a 
              href="https://github.com/basirulakhlakborno" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              Basirul Akhlak Borno
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

