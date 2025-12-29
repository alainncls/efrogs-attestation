import './Footer.css';
import LogoGitHub from '../assets/icons/github.svg';
import XLogo from '../assets/icons/x.svg';
import LogoVerax from '../assets/icons/verax.svg';

export default function Footer() {
  return (
    <footer className="footer">
      <a
        href="https://github.com/alainncls/efrogs-attestation"
        rel="nofollow noopener noreferrer"
        target="_blank"
        aria-label="View source code on GitHub"
      >
        <img src={LogoGitHub} alt="" className="svg-white" aria-hidden="true" />
      </a>
      <a
        href="https://x.com/Alain_Ncls"
        rel="nofollow noopener noreferrer"
        target="_blank"
        aria-label="Follow @Alain_Ncls on X"
      >
        <img src={XLogo} alt="" className="svg-white" aria-hidden="true" />
      </a>
      <a
        href="https://www.ver.ax"
        rel="nofollow noopener noreferrer"
        target="_blank"
        aria-label="Learn more about Verax"
      >
        <img src={LogoVerax} alt="" aria-hidden="true" />
      </a>
    </footer>
  );
}
