import { HiHome, HiPlusCircle, HiLogin, HiSun, HiMoon } from 'react-icons/hi';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.less';

function Header() {
  const { theme, toggleTheme } = useTheme();

  const handleNavClick = (e, hash) => {
    e.preventDefault();
    window.location.hash = hash;
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <div className="header-logo-wrapper">
            <svg 
              className="header-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              aria-label="Arch Linux" 
              role="img" 
              viewBox="0 0 512 512"
            >
              <rect width="512" height="512" rx="15%" className="arch-bg"></rect>
              <path d="M256 72c-14 35-23 57-39 91 10 11 22 23 41 36-21-8-35-17-45-26-21 43-53 103-117 220 50-30 90-48 127-55-2-7-3-14-3-22v-1c1-33 18-58 38-56 20 1 36 29 35 62l-2 17c36 7 75 26 125 54l-27-50c-13-10-27-23-55-38 19 5 33 11 44 17-86-159-93-180-122-250z" className="arch-path"></path>
            </svg>
            <h1 className="header-logo">SynsEvo</h1>
          </div>
          <span className="header-tagline">Watch videos together</span>
        </div>
        <nav className="header-nav">
          <a 
            href="#" 
            className="nav-link"
            onClick={(e) => handleNavClick(e, '#')}
          >
            <HiHome className="nav-icon" />
            <span className="nav-label">Home</span>
          </a>
          <a 
            href="#" 
            className="nav-link"
            onClick={(e) => handleNavClick(e, '#watch')}
          >
            <HiPlusCircle className="nav-icon" />
            <span className="nav-label">Create</span>
          </a>
          <a 
            href="#" 
            className="nav-link"
            onClick={(e) => handleNavClick(e, '#')}
          >
            <HiLogin className="nav-icon" />
            <span className="nav-label">Join</span>
          </a>
          <button 
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <HiMoon className="theme-icon" />
            ) : (
              <HiSun className="theme-icon" />
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;

