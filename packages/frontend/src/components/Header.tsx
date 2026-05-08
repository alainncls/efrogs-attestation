import { memo, useCallback, useState } from 'react';
import { useAccount } from 'wagmi';
import './Header.css';
import { initializeAppKit } from '../appkit.ts';

const truncateAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

function Header() {
  const { address, isConnected } = useAccount();
  const [isWalletLoading, setIsWalletLoading] = useState(false);

  const openWallet = useCallback(async () => {
    setIsWalletLoading(true);

    try {
      const appKit = await initializeAppKit();
      await appKit.open({ view: isConnected ? 'Account' : 'Connect' });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('AppKit failed to open:', error);
      }
    } finally {
      setIsWalletLoading(false);
    }
  }, [isConnected]);

  const label = isWalletLoading
    ? 'Loading...'
    : address
      ? truncateAddress(address)
      : 'Connect wallet';

  return (
    <header className={'header'}>
      <button
        type="button"
        className="wallet-button"
        onClick={openWallet}
        disabled={isWalletLoading}
        aria-busy={isWalletLoading}
      >
        {label}
      </button>
    </header>
  );
}

export default memo(Header);
