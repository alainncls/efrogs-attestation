import { memo, useCallback } from 'react';
import { useSwitchChain } from 'wagmi';
import { linea } from 'wagmi/chains';
import './ChainMismatchBanner.css';

function ChainMismatchBanner() {
  const { switchChain, isPending } = useSwitchChain();

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: linea.id });
  }, [switchChain]);

  return (
    <div className="chain-mismatch-banner" role="alert">
      <span>Please switch to Linea network to use this app</span>
      <button
        type="button"
        onClick={handleSwitchChain}
        disabled={isPending}
        className="switch-chain-btn"
        aria-busy={isPending}
      >
        {isPending ? 'Switching...' : 'Switch to Linea'}
      </button>
    </div>
  );
}

export default memo(ChainMismatchBanner);
