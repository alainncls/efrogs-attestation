import { memo, useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import './DetailsModal.css';
import type { Hex } from 'viem';
import {
  getAttestationExplorerUrl,
  getTransactionExplorerUrl,
} from '../utils/attestationReceipt.ts';

const truncateHexString = (hexString: string) => {
  return `${hexString.slice(0, 6)}...${hexString.slice(-4)}`;
};

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chainId: number;
  txHash?: Hex;
  attestationId?: Hex;
  message?: string;
}

const DetailsModal = ({
  isOpen,
  onClose,
  chainId,
  txHash,
  attestationId,
  message,
}: DetailsModalProps) => {
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

  const attestationUrl = attestationId
    ? getAttestationExplorerUrl(chainId, attestationId)
    : undefined;
  const txUrl = txHash ? getTransactionExplorerUrl(chainId, txHash) : undefined;

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

        {attestationId && attestationUrl ? (
          <div className="message" id="modal-title">
            Attestation ID:{' '}
            <a
              href={attestationUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View attestation ${truncateHexString(attestationId)} on Verax Explorer`}
            >
              {truncateHexString(attestationId)}
            </a>
          </div>
        ) : null}

        {txHash && txUrl ? (
          <div className={`message sub ${attestationId ? '' : 'pending'}`}>
            Transaction Hash:{' '}
            <a
              href={txUrl}
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
