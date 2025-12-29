import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import './DetailsModal.css';
import { Hex } from 'viem';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  txHash?: Hex;
  attestationId?: Hex;
  message?: string;
}

const DetailsModal = ({
  isOpen,
  onClose,
  txHash,
  attestationId,
  message,
}: DetailsModalProps) => {
  const { chainId } = useAccount();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const truncateHexString = (hexString: string) => {
    return `${hexString.slice(0, 6)}...${hexString.slice(-4)}`;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const explorerBaseUrl =
    chainId === 59144
      ? 'https://explorer.ver.ax/linea/attestations/'
      : 'https://explorer.ver.ax/linea-sepolia/attestations/';

  const txExplorerBaseUrl =
    chainId === 59144
      ? 'https://lineascan.build/tx/'
      : 'https://sepolia.lineascan.build/tx/';

  return (
    <div
      className="overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeButtonRef}
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        {!message && (
          <>
            {!txHash && !attestationId && (
              <div
                className="message pending"
                role="status"
                aria-live="polite"
                id="modal-title"
              >
                User validation pending...
              </div>
            )}
            {txHash && !attestationId && (
              <div
                className="message pending"
                role="status"
                aria-live="polite"
                id="modal-title"
              >
                Transaction pending...
              </div>
            )}
          </>
        )}

        {message && (
          <div className="message error" role="alert" id="modal-title">
            {message}
          </div>
        )}

        {attestationId && (
          <div className="message" id="modal-title">
            Attestation ID:{' '}
            <a
              href={`${explorerBaseUrl}${attestationId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View attestation ${truncateHexString(attestationId)} on Verax Explorer`}
            >
              {truncateHexString(attestationId)}
            </a>
          </div>
        )}

        {txHash && (
          <div className={`message sub ${attestationId ? '' : 'pending'}`}>
            Transaction Hash:{' '}
            <a
              href={`${txExplorerBaseUrl}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View transaction ${truncateHexString(txHash)} on Lineascan`}
            >
              {truncateHexString(txHash)}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsModal;
