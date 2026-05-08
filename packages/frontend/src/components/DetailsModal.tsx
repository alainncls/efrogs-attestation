import { memo, useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { useChainId } from 'wagmi';
import './DetailsModal.css';
import type { Hex } from 'viem';

const LINEA_MAINNET_CHAIN_ID = 59144;

const truncateHexString = (hexString: string) => {
  return `${hexString.slice(0, 6)}...${hexString.slice(-4)}`;
};

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
  const chainId = useChainId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleOverlayClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isMainnet = chainId === LINEA_MAINNET_CHAIN_ID;
  const explorerBaseUrl = isMainnet
    ? 'https://explorer.ver.ax/linea/attestations/'
    : 'https://explorer.ver.ax/linea-sepolia/attestations/';

  const txExplorerBaseUrl = isMainnet
    ? 'https://lineascan.build/tx/'
    : 'https://sepolia.lineascan.build/tx/';

  const showValidationPending = !message && !txHash && !attestationId;
  const showTransactionPending = !message && txHash && !attestationId;

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

        {!message ? (
          <>
            {showValidationPending ? (
              <div
                className="message pending"
                role="status"
                aria-live="polite"
                id="modal-title"
              >
                User validation pending...
              </div>
            ) : null}
            {showTransactionPending ? (
              <div
                className="message pending"
                role="status"
                aria-live="polite"
                id="modal-title"
              >
                Transaction pending...
              </div>
            ) : null}
          </>
        ) : null}

        {message ? (
          <div className="message error" role="alert" id="modal-title">
            {message}
          </div>
        ) : null}

        {attestationId ? (
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
        ) : null}

        {txHash ? (
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
        ) : null}
      </div>
    </div>
  );
};

export default memo(DetailsModal);
