import { memo, useCallback, useEffect, useRef } from 'react';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent,
  RefObject,
} from 'react';
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
  returnFocusRef?: RefObject<HTMLElement | null>;
  fallbackFocusRef?: RefObject<HTMLElement | null>;
}

const DetailsModal = ({
  isOpen,
  onClose,
  chainId,
  txHash,
  attestationId,
  message,
  returnFocusRef,
  fallbackFocusRef,
}: DetailsModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const handleOverlayClick = useCallback(
    (e: MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleDialogKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDialogElement>) => {
      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.getAttribute('aria-hidden') !== 'true');
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!isOpen || dialog.open) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined;
    const returnFocusTarget = returnFocusRef?.current;
    const fallbackFocusTarget = fallbackFocusRef?.current;
    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
      requestAnimationFrame(() => {
        const preferredTarget = returnFocusTarget ?? previouslyFocused;
        if (
          preferredTarget?.isConnected &&
          !('disabled' in preferredTarget && preferredTarget.disabled)
        ) {
          preferredTarget.focus();
          return;
        }
        fallbackFocusTarget?.focus();
      });
    };
  }, [fallbackFocusRef, isOpen, returnFocusRef]);

  if (!isOpen) return null;

  const attestationUrl = attestationId
    ? getAttestationExplorerUrl(chainId, attestationId)
    : undefined;
  const txUrl = txHash ? getTransactionExplorerUrl(chainId, txHash) : undefined;

  const showValidationPending = !message && !txHash && !attestationId;
  const showTransactionPending = !message && txHash && !attestationId;

  return (
    <dialog
      ref={dialogRef}
      className="overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleDialogKeyDown}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="modal-title"
    >
      <div className="modal">
        <h2 id="modal-title" className="sr-only">
          Attestation status
        </h2>
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
              <div className="message pending" role="status" aria-live="polite">
                User validation pending...
              </div>
            ) : null}
            {showTransactionPending ? (
              <div className="message pending" role="status" aria-live="polite">
                Transaction pending...
              </div>
            ) : null}
          </>
        ) : null}

        {message ? (
          <div className="message error" role="alert">
            {message}
          </div>
        ) : null}

        {attestationId && attestationUrl ? (
          <div className="message" role="status" aria-live="polite">
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
    </dialog>
  );
};

export default memo(DetailsModal);
