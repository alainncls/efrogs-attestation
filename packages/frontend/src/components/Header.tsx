import './Header.css';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header() {
  return (
    <header className={'header'}>
      <ConnectButton showBalance={false} chainStatus={'none'} />
    </header>
  );
}
