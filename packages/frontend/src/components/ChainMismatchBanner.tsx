import { useSwitchChain } from 'wagmi';
import { linea } from 'wagmi/chains';
import './ChainMismatchBanner.css';

export default function ChainMismatchBanner() {
  const { switchChain, isPending } = useSwitchChain();

  const handleSwitchChain = () => {
    switchChain({ chainId: linea.id });
  };

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
