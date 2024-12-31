import './Footer.css';
import LogoGitHub from '../assets/icons/github.svg';
import XLogo from '../assets/icons/x.svg';
import LogoVerax from '../assets/icons/verax.svg';

export default function Footer() {
  return (
    <footer className={'footer'}>
      <a
        href={'https://github.com/alainncls/efrogs-attestation'}
        rel={'nofollow noopener'}
        target={'_blank'}
      >
        <img src={LogoGitHub} alt="GitHub logo" className={'svg-white'} />
      </a>
      <a
        href={'https://x.com/Alain_Ncls'}
        rel={'nofollow noopener'}
        target={'_blank'}
      >
        <img src={XLogo} alt="X logo" className={'svg-white'} />
      </a>
      <a
        href={'https://www.ver.ax'}
        rel={'nofollow noopener'}
        target={'_blank'}
      >
        <img src={LogoVerax} alt="Verax logo" />
      </a>
    </footer>
  );
}
