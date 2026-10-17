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
  return `${hexString.slice(0, 6)}…${hexString.slice(-4)}`;
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

  const title = attestationId
    ? 'Attested'
    : txHash
      ? 'Pending…'
      : 'Confirm in wallet';

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
      aria-label="Attestation status"
    >
      <div className="modal">
        <button
          ref={closeButtonRef}
          type="button"
          className="close-button"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {message ? (
          <p className="modal-title error" role="alert">
            {message}
          </p>
        ) : (
          <p className="modal-title" role="status" aria-live="polite">
            {title}
          </p>
        )}

        {(attestationId && attestationUrl) || (txHash && txUrl) ? (
          <dl className="modal-links">
            {attestationId && attestationUrl ? (
              <div>
                <dt>Attestation</dt>
                <dd>
                  <a
                    href={attestationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View attestation ${truncateHexString(attestationId)}`}
                  >
                    {truncateHexString(attestationId)}
                  </a>
                </dd>
              </div>
            ) : null}
            {txHash && txUrl ? (
              <div>
                <dt>Transaction</dt>
                <dd>
                  <a
                    href={txUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View transaction ${truncateHexString(txHash)}`}
                  >
                    {truncateHexString(txHash)}
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </div>
    </dialog>
  );
};

export default memo(DetailsModal);
